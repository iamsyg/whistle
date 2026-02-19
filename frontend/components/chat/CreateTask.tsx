// frontend/components/chat/CreateTask.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCreateTask } from '@/hooks/chat/useCreateTask';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { ChatMember } from '@/types/chat/members';

interface CreateTaskProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  // availableAssignees?: ChatMember[];
}

const CreateTask: React.FC<CreateTaskProps> = ({
  visible,
  onClose,
  isDarkMode = false,
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  // const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedAssignees, setSelectedAssignees] = useState<ChatMember[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [assigneeStatuses, setAssigneeStatuses] = useState<Record<string, 'pending' | 'in_progress' | 'completed'>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dispatch = useDispatch();

  const selectedChatId = useSelector(
    (state: RootState) => state.conversation.selectedChatId
  )

  if (!selectedChatId) return;

  const members = useSelector((state: RootState) => {
    if (!selectedChatId) return [];
    return state.chatMembers.membersByChatId[selectedChatId] ?? [];
  });

  const { createTask, loading } = useCreateTask(selectedChatId);


  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(new Date());
    setStatus('pending');
    // setPriority('medium');
    setSelectedAssignees([]);
    setAssigneeStatuses({});
    setErrors({});
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (selectedAssignees.length === 0) {
      newErrors.assignees = 'At least one assignee is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (validateForm()) {
      const taskData: any = {
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate.toISOString(),
        status,
        assignees: selectedAssignees.map(a => ({
          user_id: a.user_id,
          status: assigneeStatuses[a.user_id] || "pending",
        }))
      };

      try {
        await createTask({
          title: taskData.title!,
          description: taskData.description!,
          due_date: taskData.due_date!,
          task_status: taskData.status!,
          assignee_ids: selectedAssignees.map(a => a.user_id),
        })

        handleClose();

        // Show success message
        Alert.alert(
          'Success',
          'Task created successfully!',
          [{ text: 'OK' }]
        );

      } catch (error) {
        console.error("Error creating task:", error);
        Alert.alert("Error", "Failed to create task. Please try again.");
      }
    }
  };

  // Toggle assignee selection
  const toggleAssignee = (assignee: ChatMember) => {
    setSelectedAssignees(prev => {
      const isSelected = prev.some(a => a.user_id === assignee.user_id);

      if (isSelected) {
        // Remove assignee and their status
        const newStatuses = { ...assigneeStatuses };
        delete newStatuses[assignee.user_id];
        setAssigneeStatuses(newStatuses);
        return prev.filter(a => a.user_id !== assignee.user_id);
      } else {
        // Add assignee with default status
        setAssigneeStatuses(prev => ({ ...prev, [assignee.user_id]: 'pending' }));
        return [...prev, assignee];
      }
    });
  };

  // Update assignee status
  const updateAssigneeStatus = (assigneeId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    setAssigneeStatuses(prev => ({
      ...prev,
      [assigneeId]: newStatus,
    }));
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'in_progress': return '#FF9500';
      default: return '#666666';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#666666';
    }
  };

  const theme = {
    light: {
      background: '#FFFFFF',
      card: '#F8F8F8',
      text: '#000000',
      subtext: '#666666',
      border: '#E5E5E5',
      inputBackground: '#F5F5F5',
    },
    dark: {
      background: '#0D1418',
      card: '#1F2C34',
      text: '#FFFFFF',
      subtext: '#A0A0A0',
      border: '#2A3942',
      inputBackground: '#1F2C34',
    },
  };

  const colors = isDarkMode ? theme.dark : theme.light;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.subtext} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Create New Task</Text>
            <TouchableOpacity 
            onPress={handleSubmit} 
            style={styles.submitButton}
            disabled={loading}
            >
              <Text style={styles.submitButtonText}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: errors.title ? '#FF3B30' : colors.border,
                  },
                ]}
                placeholder="Enter task title"
                placeholderTextColor={colors.subtext}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>

            {/* Description Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: errors.description ? '#FF3B30' : colors.border,
                  },
                ]}
                placeholder="Enter task description"
                placeholderTextColor={colors.subtext}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            {/* Due Date */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Due Date</Text>
              <TouchableOpacity
                style={[
                  styles.datePickerButton,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.subtext} />
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {dueDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.subtext} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event: any, selectedDate?: Date) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDueDate(selectedDate);
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Status */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Task Status</Text>
              <View style={styles.statusContainer}>
                {(['pending', 'in_progress', 'completed'] as const).map((statusOption) => (
                  <TouchableOpacity
                    key={statusOption}
                    style={[
                      styles.statusOption,
                      {
                        backgroundColor: status === statusOption
                          ? getStatusColor(statusOption)
                          : colors.inputBackground,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setStatus(statusOption)}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        {
                          color: status === statusOption
                            ? '#FFFFFF'
                            : colors.subtext,
                        },
                      ]}
                    >
                      {statusOption === 'in_progress' ? 'In Progress' :
                        statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Priority */}
            {/* <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
              <View style={styles.priorityContainer}>
                {(['low', 'medium', 'high'] as const).map((priorityOption) => (
                  <TouchableOpacity
                    key={priorityOption}
                    style={[
                      styles.priorityOption,
                      {
                        backgroundColor: priority === priorityOption 
                          ? getPriorityColor(priorityOption) 
                          : colors.inputBackground,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setPriority(priorityOption)}
                  >
                    <Text
                      style={[
                        styles.priorityOptionText,
                        {
                          color: priority === priorityOption 
                            ? '#FFFFFF' 
                            : colors.subtext,
                        },
                      ]}
                    >
                      {priorityOption.charAt(0).toUpperCase() + priorityOption.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View> */}

            {/* Assignees */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Assignees *</Text>
              {errors.assignees && (
                <Text style={styles.errorText}>{errors.assignees}</Text>
              )}

              {/* Available Assignees */}
              <View style={styles.assigneesList}>
                {members.map((members: ChatMember) => {
                  const isSelected = selectedAssignees.some(a => a.user_id === members.user_id);
                  return (
                    <View key={members.user_id} style={styles.assigneeItem}>
                      <TouchableOpacity
                        style={[
                          styles.assigneeSelectButton,
                          {
                            backgroundColor: colors.inputBackground,
                            borderColor: isSelected ? getPriorityColor('medium') : colors.border,
                            borderWidth: isSelected ? 2 : 1,
                          },
                        ]}
                        onPress={() => toggleAssignee(members)}
                      >
                        <View style={styles.assigneeInfo}>
                          <View style={[styles.assigneeAvatar, { backgroundColor: getPriorityColor('medium') + '20' }]}>
                            <Text style={[styles.assigneeInitial, { color: getPriorityColor('medium') }]}>
                              {members?.name?.charAt(0)}
                            </Text>
                          </View>
                          <Text style={[styles.assigneeName, { color: colors.text }]}>
                            {members.name}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color={getPriorityColor('medium')} />
                        )}
                      </TouchableOpacity>

                      {/* Assignee Status (only if selected) */}
                      {isSelected && (
                        <View style={styles.assigneeStatusContainer}>
                          {(['pending', 'in_progress', 'completed'] as const).map((statusOption) => (
                            <TouchableOpacity
                              key={statusOption}
                              style={[
                                styles.assigneeStatusOption,
                                {
                                  backgroundColor: assigneeStatuses[members.user_id] === statusOption
                                    ? getStatusColor(statusOption)
                                    : colors.inputBackground,
                                },
                              ]}
                              onPress={() => updateAssigneeStatus(members.user_id, statusOption)}
                            >
                              <Text
                                style={[
                                  styles.assigneeStatusText,
                                  {
                                    color: assigneeStatuses[members.user_id] === statusOption
                                      ? '#FFFFFF'
                                      : colors.subtext,
                                  },
                                ]}
                              >
                                {statusOption === 'in_progress' ? 'In Progress' :
                                  statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  submitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#008069',
    borderRadius: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  assigneesList: {
    marginTop: 8,
  },
  assigneeItem: {
    marginBottom: 12,
  },
  assigneeSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  assigneeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assigneeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assigneeInitial: {
    fontSize: 14,
    fontWeight: '600',
  },
  assigneeName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  assigneeStatusContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginLeft: 44,
    gap: 4,
  },
  assigneeStatusOption: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  assigneeStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default CreateTask;