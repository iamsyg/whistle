// frontend/components/TasksTab.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FloatingActionButton from './FloatingActionButton';
import CreateTask from './chat/CreateTask';

// Update the Task interface to match CreateTask's output
interface Assignee {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: Assignee[]; // Changed from string to Assignee[]
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface TasksTabProps {
  isDarkMode?: boolean;
}

const TasksTab: React.FC<TasksTabProps> = ({ isDarkMode = false }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [createTaskVisible, setCreateTaskVisible] = useState(false);

  // Update mockTasks to match the new Task interface
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Design Review',
      description: 'Review the final design mockups for the mobile app',
      assignedTo: [{ id: '1', name: 'You', status: 'pending' }],
      dueDate: new Date(Date.now() + 86400000),
      status: 'pending',
      priority: 'high',
    },
    {
      id: '2',
      title: 'API Integration',
      description: 'Integrate backend API with chat functionality',
      assignedTo: [{ id: '2', name: 'John Doe', status: 'in-progress' }],
      dueDate: new Date(Date.now() + 172800000),
      status: 'in-progress',
      priority: 'medium',
    },
    {
      id: '3',
      title: 'Documentation',
      description: 'Write technical documentation for the new features',
      assignedTo: [{ id: '3', name: 'Jane Smith', status: 'pending' }],
      dueDate: new Date(Date.now() + 259200000),
      status: 'pending',
      priority: 'low',
    },
    {
      id: '4',
      title: 'Bug Fixes',
      description: 'Fix critical bugs reported in production',
      assignedTo: [
        { id: '1', name: 'You', status: 'completed' },
        { id: '4', name: 'Bob Johnson', status: 'completed' }
      ],
      dueDate: new Date(Date.now() + 43200000),
      status: 'completed',
      priority: 'high',
    },
  ];

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = useCallback(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const filteredTasks = filter === 'all' 
        ? mockTasks 
        : mockTasks.filter(task => task.status === filter);
      setTasks(filteredTasks);
      setLoading(false);
    }, 500);
  }, [filter]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      loadTasks();
      setRefreshing(false);
    }, 1000);
  }, [loadTasks]);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#666666';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'in-progress': return '#FF9500';
      default: return '#666666';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'in-progress': return 'time-outline';
      default: return 'ellipse-outline';
    }
  }, []);

  const handleCreateTask = useCallback((taskData: Partial<Task>) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.title || '',
      description: taskData.description || '',
      assignedTo: taskData.assignedTo || [],
      dueDate: taskData.dueDate || new Date(),
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
    };
    
    setTasks(prevTasks => [newTask, ...prevTasks]);
    
    // Show success message
    Alert.alert(
      'Success',
      'Task created successfully!',
      [{ text: 'OK' }]
    );
    
    console.log('Task created:', newTask);
  }, []);

  // Helper function to get assignee names for display
  const getAssigneeNames = useCallback((assignees: Assignee[]) => {
    if (assignees.length === 0) return 'Unassigned';
    if (assignees.length === 1) return assignees[0].name;
    return `${assignees[0].name} +${assignees.length - 1}`;
  }, []);

  // Get overall task status based on assignees (optional feature)
  const getOverallStatus = useCallback((assignees: Assignee[]) => {
    if (assignees.length === 0) return 'pending';
    
    const allCompleted = assignees.every(a => a.status === 'completed');
    if (allCompleted) return 'completed';
    
    const anyInProgress = assignees.some(a => a.status === 'in-progress');
    if (anyInProgress) return 'in-progress';
    
    return 'pending';
  }, []);

  const renderTaskItem = useCallback(({ item }: { item: Task }) => {
    const overallStatus = getOverallStatus(item.assignedTo);
    
    return (
      <TouchableOpacity
        style={[
          styles.taskCard,
          {
            backgroundColor: isDarkMode ? '#1F2C34' : '#FFFFFF',
            borderColor: isDarkMode ? '#2A3942' : '#F0F0F0',
          },
        ]}
        activeOpacity={0.7}
        onPress={() => {
          // Navigate to task details
          console.log('Task pressed:', item.id);
        }}
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleRow}>
            <Ionicons 
              name={getStatusIcon(overallStatus)} 
              size={20} 
              color={getStatusColor(overallStatus)} 
            />
            <Text style={[
              styles.taskTitle,
              { color: isDarkMode ? '#FFFFFF' : '#000000' }
            ]} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
              {item.priority.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={[
          styles.taskDescription,
          { color: isDarkMode ? '#A0A0A0' : '#666666' }
        ]} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.taskFooter}>
          <View style={styles.assigneeContainer}>
            <Ionicons name="people-outline" size={14} color={isDarkMode ? '#A0A0A0' : '#666666'} />
            <Text style={[
              styles.assigneeText,
              { color: isDarkMode ? '#A0A0A0' : '#666666' }
            ]} numberOfLines={1}>
              {getAssigneeNames(item.assignedTo)}
            </Text>
          </View>
          
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={14} color={isDarkMode ? '#A0A0A0' : '#666666'} />
            <Text style={[
              styles.dateText,
              { color: isDarkMode ? '#A0A0A0' : '#666666' }
            ]}>
              {item.dueDate.toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Show assignee status indicators if multiple assignees */}
        {item.assignedTo.length > 1 && (
          <View style={styles.assigneeStatusRow}>
            {item.assignedTo.slice(0, 3).map((assignee, index) => (
              <View 
                key={assignee.id}
                style={[
                  styles.assigneeStatusDot,
                  { 
                    backgroundColor: getStatusColor(assignee.status),
                    marginLeft: index > 0 ? -4 : 0,
                  }
                ]}
              />
            ))}
            {item.assignedTo.length > 3 && (
              <Text style={[styles.assigneeMoreText, { color: isDarkMode ? '#A0A0A0' : '#666666' }]}>
                +{item.assignedTo.length - 3}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }, [isDarkMode, getPriorityColor, getStatusColor, getStatusIcon, getAssigneeNames, getOverallStatus]);

  const theme = useMemo(() => ({
    light: {
      background: '#FFFFFF',
      text: '#000000',
    },
    dark: {
      background: '#0D1418',
      text: '#FFFFFF',
    },
  }), []);

  const colors = isDarkMode ? theme.dark : theme.light;

  const filterButtons = useMemo(() => (
    ['all', 'pending', 'completed'] as const
  ), []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {filterButtons.map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              filter === filterType && styles.filterButtonActive,
              filter === filterType && { backgroundColor: isDarkMode ? '#00A884' : '#008069' },
            ]}
            onPress={() => setFilter(filterType)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === filterType ? '#FFFFFF' : (isDarkMode ? '#A0A0A0' : '#666666') },
              ]}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tasks List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#00A884' : '#008069'} />
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tasksList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[isDarkMode ? '#00A884' : '#008069']}
              tintColor={isDarkMode ? '#00A884' : '#008069'}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons 
                name="checkmark-circle-outline" 
                size={64} 
                color={isDarkMode ? '#2A3942' : '#E0E0E0'} 
              />
              <Text style={[styles.emptyStateText, { color: isDarkMode ? '#A0A0A0' : '#666666' }]}>
                No tasks found
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: isDarkMode ? '#2A3942' : '#E0E0E0' }]}>
                {filter === 'all' ? 'Create your first task' : `No ${filter} tasks`}
              </Text>
              {filter === 'all' && (
                <TouchableOpacity
                  style={[styles.createButton, { backgroundColor: isDarkMode ? '#00A884' : '#008069' }]}
                  onPress={() => setCreateTaskVisible(true)}
                >
                  <Text style={styles.createButtonText}>Create Task</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <FloatingActionButton
        iconName="add"
        backgroundColor={isDarkMode ? '#00A884' : '#008069'}
        onPress={() => setCreateTaskVisible(true)}
        bottom={60}
        right={16}
        size={56}
      />

      <CreateTask
        visible={createTaskVisible}
        onClose={() => setCreateTaskVisible(false)}
        onSubmit={handleCreateTask}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  filterButtonActive: {
    backgroundColor: '#008069',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tasksList: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  taskCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  assigneeText: {
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    marginLeft: 4,
  },
  assigneeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  assigneeStatusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  assigneeMoreText: {
    fontSize: 10,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginBottom: 16,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TasksTab;