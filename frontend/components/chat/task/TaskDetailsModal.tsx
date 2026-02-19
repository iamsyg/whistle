// frontend/components/chat/task/TaskDetailsModal.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  Animated,
  PanResponder,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
// import { TaskListItem } from '@/types/chat/task/taskListItem';
import { TaskDetails } from '@/types/chat/task/taskDetails';
import { Assignees } from '@/types/chat/task/taskDetails';
import { useFetchTaskDetails } from '@/hooks/chat/task/useFetchTaskDetails';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

const { width, height } = Dimensions.get('window');


interface TaskDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  taskId: string;
  isDarkMode?: boolean;
  onSave?: (updatedTask: TaskDetails) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  visible,
  onClose,
  taskId,
  isDarkMode = false,
  onSave,
}) => {
  const [editedTask, setEditedTask] = useState<TaskDetails | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedAssigneeForStatus, setSelectedAssigneeForStatus] = useState<string | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const selectedChatId = useSelector(
    (state: RootState) => state.conversation.selectedChatId
  );

  if (!selectedChatId) {
    console.error("No chat selected. Cannot fetch task details.");
    return null;
    }

  const task = useSelector(
    (state: RootState) => {
        if (!selectedChatId || !taskId) return null;
        return state.task.tasksById[taskId]
    }
  );

  const { fetchTaskDetails, loading } = useFetchTaskDetails( taskId && selectedChatId ? taskId : '',
  selectedChatId || '');



  useEffect(() => {
    if (taskId && selectedChatId) {
      fetchTaskDetails();
    }
  }, [taskId, selectedChatId]);

  useEffect(() => {
    if (task) {
      // Remove priority from the task when setting editedTask
      const { ...taskWithoutPriority } = task;
      setEditedTask(taskWithoutPriority as TaskDetails);
      setHasChanges(false);
    }
  }, [task]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 20;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          handleClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 5,
          }).start();
        }
      },
    })
  ).current;

  if (!editedTask || !task) return null;

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  const handleFieldChange = <K extends keyof TaskDetails>(field: K, value: TaskDetails[K]) => {
    setEditedTask(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };

      const didChange =
        updated.title !== task.title ||
        updated.description !== task.description ||
        updated.status !== task.status ||
        updated.due_date !== task.due_date ||
        JSON.stringify(updated.assignees) !== JSON.stringify(task.assignees);

      setHasChanges(didChange);
      return updated;
    });
  };

  const handleAssigneeStatusChange = (assigneeId: string, status: Assignees['status']) => {
    setEditedTask(prev => {
      if (!prev) return prev;
      const updatedAssignees = prev.assignees?.map(a =>
        a.user_id === assigneeId ? { ...a, status } : a
      );
      const updated = { ...prev, assignees: updatedAssignees };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(task));
      return updated;
    });
    setSelectedAssigneeForStatus(null);
  };

  const handleSave = () => {
    if (editedTask && onSave) {
      onSave(editedTask);
      Alert.alert(
        'Success',
        'Task updated successfully!',
        [{ text: 'OK' }],
      );
      onClose();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'in_progress': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'in_progress': return 'time';
      default: return 'ellipse-outline';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateForDisplay = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const isOverdue = (date: Date) => {
    return date < new Date() && editedTask.status !== 'completed';
  };

  const theme = {
    background: isDarkMode ? '#1C1C1E' : '#FFFFFF',
    card: isDarkMode ? '#2C2C2E' : '#F8F9FA',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#8E8E93' : '#6C757D',
    border: isDarkMode ? '#3A3A3C' : '#E9ECEF',
    inputBackground: isDarkMode ? '#3A3A3C' : '#FFFFFF',
    primary: isDarkMode ? '#0A84FF' : '#007AFF',
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
      
      <Animated.View 
        style={[
          styles.modalOverlay,
          {
            opacity: fadeAnim,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        ]}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.background,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer}>
              <View style={[styles.dragHandle, { backgroundColor: theme.border }]} />
            </View>

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <TouchableOpacity 
                onPress={handleClose} 
                style={styles.headerButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
              
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Task Details
              </Text>
              
              <TouchableOpacity
                onPress={handleSave}
                disabled={!hasChanges}
                style={[
                  styles.headerButton,
                  !hasChanges && styles.saveButtonDisabled
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[
                  styles.saveButtonText,
                  { color: hasChanges ? theme.primary : theme.textSecondary }
                ]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              bounces={false}
            >
              {/* Title Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  Task Title
                </Text>
                <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                  <Ionicons 
                    name="document-text-outline" 
                    size={20} 
                    color={theme.textSecondary} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.titleInput, { color: theme.text }]}
                    value={editedTask.title}
                    onChangeText={(text) => handleFieldChange('title', text)}
                    placeholder="Enter task title"
                    placeholderTextColor={theme.textSecondary}
                    multiline
                  />
                </View>
              </View>

              {/* Description Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  Description
                </Text>
                <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                  <TextInput
                    style={[styles.descriptionInput, { color: theme.text }]}
                    value={editedTask?.description || ''}
                    onChangeText={(text) => handleFieldChange('description', text)}
                    placeholder="Enter task description"
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Status Dropdown */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  Status
                </Text>
                <TouchableOpacity
                  style={[styles.dropdownButton, { borderColor: theme.border, backgroundColor: theme.card }]}
                  onPress={() => setShowStatusDropdown(!showStatusDropdown)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dropdownButtonContent}>
                    <View style={[styles.statusIcon, { backgroundColor: getStatusColor(editedTask.status) + '20' }]}>
                      <Ionicons
                        name={getStatusIcon(editedTask.status)}
                        size={18}
                        color={getStatusColor(editedTask.status)}
                      />
                    </View>
                    <Text style={[styles.dropdownButtonText, { color: theme.text }]}>
                      {editedTask.status === 'in_progress' ? 'In Progress' : editedTask.status.charAt(0).toUpperCase() + editedTask.status.slice(1)}
                    </Text>
                  </View>
                  <Ionicons 
                    name={showStatusDropdown ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={theme.textSecondary} 
                  />
                </TouchableOpacity>

                {showStatusDropdown && (
                  <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {(['pending', 'in_progress', 'completed'] as const).map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.dropdownItem,
                          editedTask.status === status && { backgroundColor: getStatusColor(status) + '15' }
                        ]}
                        onPress={() => {
                          handleFieldChange('status', status);
                          setShowStatusDropdown(false);
                        }}
                      >
                        <View style={[styles.statusIcon, { backgroundColor: getStatusColor(status) + '20' }]}>
                          <Ionicons
                            name={getStatusIcon(status)}
                            size={16}
                            color={getStatusColor(status)}
                          />
                        </View>
                        <Text style={[styles.dropdownItemText, { color: theme.text }]}>
                          {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                        {editedTask.status === status && (
                          <Ionicons name="checkmark" size={18} color={theme.primary} style={styles.checkmark} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Due Date Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  Due Date
                </Text>
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    { 
                      borderColor: isOverdue(editedTask?.due_date ? new Date(editedTask.due_date) : new Date())
                        ? theme.danger 
                        : theme.border,
                      backgroundColor: theme.card,
                    }
                  ]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.datePickerContent}>
                    <View style={styles.dateIconContainer}>
                      <Ionicons 
                        name="calendar-outline" 
                        size={20} 
                        color={isOverdue(editedTask.due_date ? new Date(editedTask.due_date) : new Date()) ? theme.danger : theme.primary} 
                      />
                    </View>
                    <View style={styles.dateInfo}>
                      <Text style={[styles.dateText, { color: theme.text }]}>
                        {formatDateForDisplay(editedTask.due_date ? new Date(editedTask.due_date) : new Date())}
                      </Text>
                      {isOverdue(editedTask.due_date ? new Date(editedTask.due_date) : new Date()) && (
                        <Text style={[styles.overdueText, { color: theme.danger }]}>
                          Overdue
                        </Text>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Metadata Section */}
              <View style={[styles.metadataSection, { backgroundColor: theme.card }]}>
                <Text style={[styles.metadataTitle, { color: theme.textSecondary }]}>
                  <Ionicons name="information-circle-outline" size={16} /> Task Information
                </Text>
                
                <View style={styles.metadataGrid}>
                  <View style={styles.metadataItem}>
                    <Ionicons name="person-outline" size={16} color={theme.primary} />
                    <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>Creator</Text>
                    <Text style={[styles.metadataValue, { color: theme.text }]}>{task?.creator?.name || 'Unknown Creator'}</Text>
                  </View>

                  <View style={styles.metadataItem}>
                    <Ionicons name="time-outline" size={16} color={theme.warning} />
                    <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>Created</Text>
                    <Text style={[styles.metadataValue, { color: theme.text }]}>
                      {formatDate(task?.created_at ? new Date(task.created_at) : new Date())}
                    </Text>
                  </View>

                  <View style={styles.metadataItem}>
                    <Ionicons name="refresh-outline" size={16} color={theme.success} />
                    <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>Updated</Text>
                    <Text style={[styles.metadataValue, { color: theme.text }]}>
                      {formatDate(task?.updated_at ? new Date(task.updated_at) : new Date())}
                    </Text>
                  </View>

                  {/* Added Updated By field */}
                  <View style={styles.metadataItem}>
                    <Ionicons name="person-circle-outline" size={16} color={theme.primary} />
                    <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>Updated By</Text>
                    <Text style={[styles.metadataValue, { color: theme.text }]}>{task?.updater?.name || 'None'}</Text>
                  </View>
                </View>
              </View>

              {/* Assignees Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                    Assignees
                  </Text>
                  <View style={[styles.assigneeCount, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.assigneeCountText, { color: theme.primary }]}>
                      {editedTask?.assignees?.length}
                    </Text>
                  </View>
                </View>

                {editedTask?.assignees?.map((assignee, index) => (
                  <View key={assignee.user_id}>
                    {selectedAssigneeForStatus === assignee.user_id ? (
                      <View style={[styles.assigneeStatusEditor, { backgroundColor: theme.card }]}>
                        <View style={styles.editorHeader}>
                          <View style={styles.editorTitle}>
                            <View style={[styles.assigneeAvatar, { backgroundColor: getStatusColor(assignee.status) + '20' }]}>
                              <Text style={[styles.assigneeAvatarText, { color: getStatusColor(assignee.status) }]}>
                                {assignee?.name?.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={[styles.assigneeName, { color: theme.text }]}>{assignee.name}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => setSelectedAssigneeForStatus(null)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="close-circle" size={22} color={theme.textSecondary} />
                          </TouchableOpacity>
                        </View>

                        <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
                          Update Status
                        </Text>
                        <View style={styles.statusOptions}>
                          {(['pending', 'in_progress', 'completed'] as const).map((status) => (
                            <TouchableOpacity
                              key={status}
                              style={[
                                styles.assigneeStatusOption,
                                assignee.status === status && {
                                  backgroundColor: getStatusColor(status) + '20',
                                  borderColor: getStatusColor(status),
                                },
                              ]}
                              onPress={() => handleAssigneeStatusChange(assignee.user_id, status)}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name={getStatusIcon(status)}
                                size={16}
                                color={getStatusColor(status)}
                              />
                              <Text style={[
                                styles.assigneeStatusOptionText,
                                { color: assignee.status === status ? getStatusColor(status) : theme.textSecondary }
                              ]}>
                                {status === 'in_progress' ? 'In Progress' : status}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.assigneeRow, { borderBottomColor: theme.border }]}
                        onPress={() => setSelectedAssigneeForStatus(assignee.user_id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.assigneeInfo}>
                          <View style={[styles.assigneeAvatar, { backgroundColor: getStatusColor(assignee.status) + '20' }]}>
                            <Text style={[styles.assigneeAvatarText, { color: getStatusColor(assignee.status) }]}>
                              {assignee?.name?.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.assigneeDetails}>
                            <Text style={[styles.assigneeName, { color: theme.text }]}>
                              {assignee.name}
                            </Text>
                            <Text style={[styles.assignedAtText, { color: theme.textSecondary }]}>
                              Assigned {formatDateForDisplay(new Date(assignee.assigned_at))}
                            </Text>
                          </View>
                        </View>
                        <View style={[
                          styles.assigneeStatus,
                          { backgroundColor: getStatusColor(assignee.status) + '15' }
                        ]}>
                          <Ionicons
                            name={getStatusIcon(assignee.status)}
                            size={12}
                            color={getStatusColor(assignee.status)}
                          />
                          <Text style={[styles.assigneeStatusText, { color: getStatusColor(assignee.status) }]}>
                            {assignee.status === 'in_progress' ? 'In Progress' : assignee.status}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              {/* Bottom Padding */}
              <View style={styles.bottomPadding} />
            </ScrollView>
          </SafeAreaView>
        </Animated.View>

        {/* Date Picker */}
        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            {Platform.OS === 'ios' ? (
              <View style={[styles.iosDatePicker, { backgroundColor: theme.background }]}>
                <View style={[styles.datePickerHeader, { borderBottomColor: theme.border }]}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={[styles.datePickerButtonText, { color: theme.primary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={[styles.datePickerTitle, { color: theme.text }]}>Select Due Date</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={[styles.datePickerButtonText, { color: theme.primary }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={editedTask.due_date ? new Date(editedTask.due_date) : new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      handleFieldChange('due_date', selectedDate.toISOString());
                    }
                  }}
                  style={styles.datePickerSpinner}
                  textColor={theme.text}
                />
              </View>
            ) : (
              <DateTimePicker
                value={editedTask.due_date ? new Date(editedTask.due_date) : new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    handleFieldChange('due_date', selectedDate.toISOString());
                  }
                }}
              />
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.95,
    minHeight: height * 0.5,
  },
  safeArea: {
    flex: 1,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
    minWidth: 44,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputIcon: {
    padding: 12,
    backgroundColor: 'transparent',
  },
  titleInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    padding: 12,
    paddingLeft: 0,
    minHeight: 50,
  },
  descriptionInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    padding: 12,
    minHeight: 100,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  dropdownButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  checkmark: {
    marginLeft: 'auto',
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  dateInfo: {
    flex: 1,
    marginLeft: 8,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '500',
  },
  overdueText: {
    fontSize: 12,
    marginTop: 2,
  },
  metadataSection: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  metadataTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metadataGrid: {
    gap: 16,
  },
  metadataItem: {
    gap: 4,
  },
  metadataLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  assigneeCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  assigneeCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  assigneeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  assigneeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assigneeAvatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  assigneeDetails: {
    flex: 1,
  },
  assigneeName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  assignedAtText: {
    fontSize: 12,
  },
  assigneeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  assigneeStatusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  assigneeStatusEditor: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  editorTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  assigneeStatusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  assigneeStatusOptionText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  bottomPadding: {
    height: 20,
  },
  datePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  iosDatePicker: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  datePickerSpinner: {
    height: 200,
  },
});

export default TaskDetailsModal;