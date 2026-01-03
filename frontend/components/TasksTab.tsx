// components/TasksTab.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
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

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Design Review',
      description: 'Review the final design mockups for the mobile app',
      assignedTo: 'You',
      dueDate: new Date(Date.now() + 86400000),
      status: 'pending',
      priority: 'high',
    },
    {
      id: '2',
      title: 'API Integration',
      description: 'Integrate backend API with chat functionality',
      assignedTo: 'John Doe',
      dueDate: new Date(Date.now() + 172800000),
      status: 'in-progress',
      priority: 'medium',
    },
    {
      id: '3',
      title: 'Documentation',
      description: 'Write technical documentation for the new features',
      assignedTo: 'Jane Smith',
      dueDate: new Date(Date.now() + 259200000),
      status: 'pending',
      priority: 'low',
    },
    {
      id: '4',
      title: 'Bug Fixes',
      description: 'Fix critical bugs reported in production',
      assignedTo: 'You',
      dueDate: new Date(Date.now() + 43200000),
      status: 'completed',
      priority: 'high',
    },
  ];

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = () => {
    setLoading(true);
    setTimeout(() => {
      const filteredTasks = filter === 'all' 
        ? mockTasks 
        : mockTasks.filter(task => task.status === filter);
      setTasks(filteredTasks);
      setLoading(false);
    }, 500);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#666666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'in-progress': return 'time-outline';
      default: return 'ellipse-outline';
    }
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={[
        styles.taskCard,
        {
          backgroundColor: isDarkMode ? '#1F2C34' : '#FFFFFF',
          borderColor: isDarkMode ? '#2A3942' : '#F0F0F0',
        },
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleRow}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={20} 
            color={item.status === 'completed' ? '#34C759' : (isDarkMode ? '#A0A0A0' : '#666666')} 
          />
          <Text style={[
            styles.taskTitle,
            { color: isDarkMode ? '#FFFFFF' : '#000000' }
          ]}>
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
      ]}>
        {item.description}
      </Text>
      
      <View style={styles.taskFooter}>
        <View style={styles.assigneeContainer}>
          <Ionicons name="person-outline" size={14} color={isDarkMode ? '#A0A0A0' : '#666666'} />
          <Text style={[
            styles.assigneeText,
            { color: isDarkMode ? '#A0A0A0' : '#666666' }
          ]}>
            {item.assignedTo}
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
    </TouchableOpacity>
  );

  const theme = {
    light: {
      background: '#FFFFFF',
      text: '#000000',
    },
    dark: {
      background: '#0D1418',
      text: '#FFFFFF',
    },
  };

  const colors = isDarkMode ? theme.dark : theme.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'completed'] as const).map((filterType) => (
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
              <Ionicons name="checkmark-circle-outline" size={64} color={isDarkMode ? '#2A3942' : '#E0E0E0'} />
              <Text style={[styles.emptyStateText, { color: isDarkMode ? '#A0A0A0' : '#666666' }]}>
                No tasks found
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: isDarkMode ? '#2A3942' : '#E0E0E0' }]}>
                {filter === 'all' ? 'Create your first task' : `No ${filter} tasks`}
              </Text>
            </View>
          }
        />
      )}
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
  },
  assigneeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
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
  },
});

export default TasksTab;