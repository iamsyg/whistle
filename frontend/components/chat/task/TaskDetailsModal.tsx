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
  FlatList,
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
import { TaskDetails, Assignees } from '@/types/chat/task/taskDetails';
import { ChatMember } from '@/types/chat/members';
import { useFetchTaskDetails } from '@/hooks/chat/task/useFetchTaskDetails';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { avatarColor, initials } from './AddAssigneeSheet';
import AddAssigneeSheet from './AddAssigneeSheet';

const { width, height } = Dimensions.get('window');

interface TaskDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  taskId: string;
  isDarkMode?: boolean;
  onSave?: (updatedTask: TaskDetails) => void;
}

// ── Shared helpers ─────────────────────────────────────────────────────────────
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return '#34C759';
    case 'in_progress': return '#FF9500';
    default: return '#8E8E93';
  }
};

const getStatusIcon = (status: string): any => {
  switch (status) {
    case 'completed': return 'checkmark-circle';
    case 'in_progress': return 'time';
    default: return 'ellipse-outline';
  }
};

const formatStatusLabel = (status: string) =>
  status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);

// ── Floating Status Picker ─────────────────────────────────────────────────────
interface StatusPickerOverlayProps {
  visible: boolean;
  onClose: () => void;
  currentStatus: string;
  onSelect: (status: 'pending' | 'in_progress' | 'completed') => void;
  title: string;
  theme: Record<string, string>;
  anchorBottom?: number;
}

const StatusPickerOverlay: React.FC<StatusPickerOverlayProps> = ({
  visible, onClose, currentStatus, onSelect, title, theme, anchorBottom = height * 0.3,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <TouchableOpacity style={pickerStyles.backdrop} activeOpacity={1} onPress={onClose}>
      <View style={[pickerStyles.card, { backgroundColor: theme.background, bottom: anchorBottom, right: 20 }]}>
        <Text style={[pickerStyles.title, { color: theme.textSecondary }]}>{title}</Text>
        {(['pending', 'in_progress', 'completed'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[pickerStyles.item, currentStatus === s && { backgroundColor: getStatusColor(s) + '15', borderRadius: 10 }]}
            onPress={() => { onSelect(s); onClose(); }}
            activeOpacity={0.7}
          >
            <View style={[pickerStyles.itemIcon, { backgroundColor: getStatusColor(s) + '20' }]}>
              <Ionicons name={getStatusIcon(s)} size={18} color={getStatusColor(s)} />
            </View>
            <Text style={[pickerStyles.itemText, { color: theme.text }]}>{formatStatusLabel(s)}</Text>
            {currentStatus === s && <Ionicons name="checkmark-circle" size={18} color={getStatusColor(s)} />}
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  </Modal>
);

const pickerStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  card: {
    position: 'absolute', width: width * 0.72, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 16, elevation: 24, zIndex: 1000,
  },
  title: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: 14, paddingTop: 6, paddingBottom: 8 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, gap: 12, marginHorizontal: 4, marginVertical: 2 },
  itemIcon: { width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  itemText: { fontSize: 15, fontWeight: '500', flex: 1 },
});



// ── Main Component ─────────────────────────────────────────────────────────────
const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  visible, onClose, taskId, isDarkMode = false, onSave,
}) => {
  const [editedTask, setEditedTask] = useState<TaskDetails | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showTaskStatusPicker, setShowTaskStatusPicker] = useState(false);
  const [openAssigneeStatusId, setOpenAssigneeStatusId] = useState<string | null>(null);
  const [showAddAssignee, setShowAddAssignee] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const selectedChatId = useSelector((state: RootState) => state.conversation.selectedChatId);

  if (!selectedChatId) {
    console.error('No chat selected. Cannot fetch task details.');
    return null;
  }

  const task = useSelector((state: RootState) => {
    if (!selectedChatId || !taskId) return null;
    return state.task.tasksById[taskId];
  });

  const { fetchTaskDetails } = useFetchTaskDetails(
    taskId && selectedChatId ? taskId : '',
    selectedChatId || ''
  );

  useEffect(() => {
    if (taskId && selectedChatId) fetchTaskDetails();
  }, [taskId, selectedChatId]);

  useEffect(() => {
    if (task) {
      const { ...rest } = task;
      setEditedTask(rest as TaskDetails);
      setHasChanges(false);
    }
  }, [task]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 20,
      onPanResponderMove: (_, g) => { if (g.dy > 0) slideAnim.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100) handleClose();
        else Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 5 }).start();
      },
    })
  ).current;

  if (!editedTask || !task) return null;

  // ── helpers ──────────────────────────────────────────────────────────────────
  const markChanged = (updated: TaskDetails) => {
    const changed =
      updated.title !== task.title ||
      updated.description !== task.description ||
      updated.status !== task.status ||
      updated.due_date !== task.due_date ||
      JSON.stringify(updated.assignees) !== JSON.stringify(task.assignees);
    setHasChanges(changed);
  };

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert('Discard Changes?', 'You have unsaved changes. Are you sure you want to discard them?', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onClose },
      ]);
    } else {
      onClose();
    }
  };

  const handleFieldChange = <K extends keyof TaskDetails>(field: K, value: TaskDetails[K]) => {
    setEditedTask(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      markChanged(updated);
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
      markChanged(updated);
      return updated;
    });
  };

  /** Add a ChatMember as a new Assignee with pending status */
  const handleAddAssignee = (member: ChatMember) => {
    setEditedTask(prev => {
      if (!prev) return prev;
      const newAssignee: Assignees = {
        user_id: member.user_id,
        name: member.name,
        username: member.username,
        avatar_url: member.avatar_url,
        status: 'pending',
        assigned_at: new Date().toISOString(),
      };
      const updatedAssignees = [...(prev.assignees ?? []), newAssignee];
      const updated = { ...prev, assignees: updatedAssignees };
      setHasChanges(true);
      return updated;
    });
  };

  /** Remove an assignee after confirmation */
  const handleRemoveAssignee = (assigneeId: string) => {
    Alert.alert('Remove Assignee', 'Remove this person from the task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: () => {
          setEditedTask(prev => {
            if (!prev) return prev;
            const updatedAssignees = prev.assignees?.filter(a => a.user_id !== assigneeId);
            const updated = { ...prev, assignees: updatedAssignees };
            markChanged(updated);
            return updated;
          });
        },
      },
    ]);
  };

  const handleSave = () => {
    if (editedTask && onSave) {
      onSave(editedTask);
      Alert.alert('Success', 'Task updated successfully!', [{ text: 'OK' }]);
      onClose();
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const formatDateForDisplay = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isOverdue = (date: Date) => date < new Date() && editedTask.status !== 'completed';

  const activeAssignee = editedTask.assignees?.find(a => a.user_id === openAssigneeStatusId) ?? null;
  const existingAssigneeIds = editedTask.assignees?.map(a => a.user_id) ?? [];

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
    <>
      {/* ── Main bottom sheet ── */}
      <Modal visible={visible} transparent onRequestClose={handleClose} statusBarTranslucent>
        <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />

        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <Animated.View
            style={[styles.modalContent, { backgroundColor: theme.background, transform: [{ translateY: slideAnim }] }]}
            {...panResponder.panHandlers}
          >
            <SafeAreaView style={styles.safeArea}>
              {/* Drag handle */}
              <View style={styles.dragHandleContainer}>
                <View style={[styles.dragHandle, { backgroundColor: theme.border }]} />
              </View>

              {/* Header */}
              <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={handleClose} style={styles.headerButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Task Details</Text>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!hasChanges}
                  style={[styles.headerButton, !hasChanges && styles.saveButtonDisabled]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.saveButtonText, { color: hasChanges ? theme.primary : theme.textSecondary }]}>Save</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} bounces={false}>

                {/* Title */}
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Task Title</Text>
                  <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                    <Ionicons name="document-text-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.titleInput, { color: theme.text }]}
                      value={editedTask.title}
                      onChangeText={text => handleFieldChange('title', text)}
                      placeholder="Enter task title"
                      placeholderTextColor={theme.textSecondary}
                      multiline
                    />
                  </View>
                </View>

                {/* Description */}
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Description</Text>
                  <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                    <TextInput
                      style={[styles.descriptionInput, { color: theme.text }]}
                      value={editedTask?.description || ''}
                      onChangeText={text => handleFieldChange('description', text)}
                      placeholder="Enter task description"
                      placeholderTextColor={theme.textSecondary}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </View>

                {/* Status */}
                <View style={styles.section}>
                  <View style={styles.statusRow}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginBottom: 0 }]}>Status</Text>
                    <TouchableOpacity
                      style={[styles.statusPill, { borderColor: theme.border, backgroundColor: theme.card }]}
                      onPress={() => setShowTaskStatusPicker(true)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.statusIconSmall, { backgroundColor: getStatusColor(editedTask.status) + '20' }]}>
                        <Ionicons name={getStatusIcon(editedTask.status)} size={14} color={getStatusColor(editedTask.status)} />
                      </View>
                      <Text style={[styles.statusPillText, { color: theme.text }]}>
                        {formatStatusLabel(editedTask.status)}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Due Date */}
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Due Date</Text>
                  <TouchableOpacity
                    style={[styles.datePickerButton, {
                      borderColor: isOverdue(editedTask?.due_date ? new Date(editedTask.due_date) : new Date()) ? theme.danger : theme.border,
                      backgroundColor: theme.card,
                    }]}
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
                          <Text style={[styles.overdueText, { color: theme.danger }]}>Overdue</Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Metadata */}
                <View style={[styles.metadataSection, { backgroundColor: theme.card }]}>
                  <Text style={[styles.metadataTitle, { color: theme.textSecondary }]}>
                    <Ionicons name="information-circle-outline" size={16} /> Task Information
                  </Text>
                  <View style={styles.metadataGrid}>
                    <View style={styles.metadataItem}>
                      <Ionicons name="person-outline" size={16} color={theme.primary} />
                      <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>Creator</Text>
                      <Text style={[styles.metadataValue, { color: theme.text }]}>{task?.creator?.name || 'Unknown'}</Text>
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
                    <View style={styles.metadataItem}>
                      <Ionicons name="person-circle-outline" size={16} color={theme.primary} />
                      <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>Updated By</Text>
                      <Text style={[styles.metadataValue, { color: theme.text }]}>{task?.updater?.name || 'None'}</Text>
                    </View>
                  </View>
                </View>

                {/* ── Assignees ── */}
                <View style={styles.section}>
                  {/* Header row: label + count badge + Add button */}
                  <View style={styles.assigneesSectionHeader}>
                    <View style={styles.assigneesSectionLeft}>
                      <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginBottom: 0 }]}>
                        Assignees
                      </Text>
                      <View style={[styles.countBadge, { backgroundColor: theme.primary + '20' }]}>
                        <Text style={[styles.countBadgeText, { color: theme.primary }]}>
                          {editedTask.assignees?.length ?? 0}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.addBtn, { borderColor: theme.primary, backgroundColor: theme.primary + '10' }]}
                      onPress={() => setShowAddAssignee(true)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="person-add-outline" size={13} color={theme.primary} />
                      <Text style={[styles.addBtnText, { color: theme.primary }]}>Add</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Empty state */}
                  {(!editedTask.assignees || editedTask.assignees.length === 0) && (
                    <TouchableOpacity
                      style={[styles.emptyAssignees, { borderColor: theme.border, backgroundColor: theme.card }]}
                      onPress={() => setShowAddAssignee(true)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="people-outline" size={28} color={theme.textSecondary} style={{ opacity: 0.45 }} />
                      <Text style={[styles.emptyAssigneesLabel, { color: theme.textSecondary }]}>No assignees yet</Text>
                      <Text style={[styles.emptyAssigneesHint, { color: theme.primary }]}>Tap to add someone</Text>
                    </TouchableOpacity>
                  )}

                  {/* Assignee rows */}
                  {editedTask.assignees?.map((assignee) => {
                    const color = avatarColor(assignee.name);
                    return (
                      <View key={assignee.user_id} style={[styles.assigneeRow, { borderBottomColor: theme.border }]}>
                        {/* Avatar + name + date */}
                        <View style={styles.assigneeLeft}>
                          <View style={[styles.assigneeAvatar, { backgroundColor: color + '22' }]}>
                            <Text style={[styles.assigneeAvatarText, { color }]}>
                              {initials(assignee.name)}
                            </Text>
                          </View>
                          <View style={styles.assigneeDetails}>
                            <Text style={[styles.assigneeName, { color: theme.text }]}>
                              {assignee.name ?? 'Unknown'}
                            </Text>
                            <Text style={[styles.assignedAtText, { color: theme.textSecondary }]}>
                              Assigned {formatDateForDisplay(new Date(assignee.assigned_at))}
                            </Text>
                          </View>
                        </View>

                        {/* Right: status pill + remove */}
                        <View style={styles.assigneeRight}>
                          <TouchableOpacity
                            style={[styles.statusPill, { borderColor: theme.border, backgroundColor: getStatusColor(assignee.status) + '15' }]}
                            onPress={() => setOpenAssigneeStatusId(assignee.user_id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name={getStatusIcon(assignee.status)} size={12} color={getStatusColor(assignee.status)} />
                            <Text style={[styles.statusPillText, { color: getStatusColor(assignee.status) }]}>
                              {formatStatusLabel(assignee.status)}
                            </Text>
                            <Ionicons name="chevron-down" size={11} color={getStatusColor(assignee.status)} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.removeBtn, { backgroundColor: theme.danger + '12' }]}
                            onPress={() => handleRemoveAssignee(assignee.user_id)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="person-remove-outline" size={13} color={theme.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>

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
                      <Text style={[styles.datePickerBtnText, { color: theme.primary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={[styles.datePickerTitle, { color: theme.text }]}>Select Due Date</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={[styles.datePickerBtnText, { color: theme.primary }]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={editedTask.due_date ? new Date(editedTask.due_date) : new Date()}
                    mode="date"
                    display="spinner"
                    onChange={(_, d) => { if (d) handleFieldChange('due_date', d.toISOString()); }}
                    style={styles.datePickerSpinner}
                    textColor={theme.text}
                  />
                </View>
              ) : (
                <DateTimePicker
                  value={editedTask.due_date ? new Date(editedTask.due_date) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(_, d) => { setShowDatePicker(false); if (d) handleFieldChange('due_date', d.toISOString()); }}
                />
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Floating task status picker ── */}
      <StatusPickerOverlay
        visible={showTaskStatusPicker}
        onClose={() => setShowTaskStatusPicker(false)}
        currentStatus={editedTask.status}
        title="Select Status"
        theme={theme}
        anchorBottom={height * 0.38}
        onSelect={status => handleFieldChange('status', status)}
      />

      {/* ── Floating assignee status picker ── */}
      <StatusPickerOverlay
        visible={openAssigneeStatusId !== null}
        onClose={() => setOpenAssigneeStatusId(null)}
        currentStatus={activeAssignee?.status ?? 'pending'}
        title={activeAssignee ? `${activeAssignee.name ?? 'Assignee'}'s Status` : 'Select Status'}
        theme={theme}
        anchorBottom={height * 0.26}
        onSelect={status => {
          if (openAssigneeStatusId) handleAssigneeStatusChange(openAssigneeStatusId, status);
          setOpenAssigneeStatusId(null);
        }}
      />

      {/* ── Add Assignee bottom sheet ── */}
      <AddAssigneeSheet
        visible={showAddAssignee}
        onClose={() => setShowAddAssignee(false)}
        onAdd={handleAddAssignee}
        existingIds={existingAssigneeIds}
        chatId={selectedChatId}
        theme={theme}
      />
    </>
  );
};


const styles = StyleSheet.create({
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  keyboardView: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.95, minHeight: height * 0.5 },
  safeArea: { flex: 1 },
  dragHandleContainer: { alignItems: 'center', paddingVertical: 12 },
  dragHandle: { width: 40, height: 4, borderRadius: 2 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1 },
  headerButton: { padding: 4, minWidth: 44, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: 16, fontWeight: '600' },

  scrollContent: { padding: 20 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  inputWrapper: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  inputIcon: { padding: 12 },
  titleInput: { flex: 1, fontSize: 16, fontWeight: '500', padding: 12, paddingLeft: 0, minHeight: 50 },
  descriptionInput: { flex: 1, fontSize: 15, lineHeight: 22, padding: 12, minHeight: 100 },

  // Status
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderRadius: 20, gap: 5 },
  statusPillText: { fontSize: 12, fontWeight: '500' },
  statusIconSmall: { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },

  // Due date
  datePickerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderRadius: 12 },
  datePickerContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dateIconContainer: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dateInfo: { flex: 1, marginLeft: 8 },
  dateText: { fontSize: 15, fontWeight: '500' },
  overdueText: { fontSize: 12, marginTop: 2 },

  // Metadata
  metadataSection: { padding: 16, borderRadius: 16, marginBottom: 24 },
  metadataTitle: { fontSize: 14, fontWeight: '600', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  metadataGrid: { gap: 16 },
  metadataItem: { gap: 4 },
  metadataLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  metadataValue: { fontSize: 14, fontWeight: '500' },

  // Assignees section header
  assigneesSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  assigneesSectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countBadgeText: { fontSize: 12, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  addBtnText: { fontSize: 13, fontWeight: '600' },

  // Empty state
  emptyAssignees: { alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 28, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  emptyAssigneesLabel: { fontSize: 14, fontWeight: '500' },
  emptyAssigneesHint: { fontSize: 13, fontWeight: '500' },

  // Assignee row
  assigneeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  assigneeLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  assigneeAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  assigneeAvatarText: { fontSize: 17, fontWeight: '600' },
  assigneeDetails: { flex: 1 },
  assigneeName: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  assignedAtText: { fontSize: 11, lineHeight: 16 },
  assigneeRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  removeBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },

  bottomPadding: { height: 20 },

  // Date picker
  datePickerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  iosDatePicker: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
  datePickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  datePickerTitle: { fontSize: 16, fontWeight: '600' },
  datePickerBtnText: { fontSize: 16, fontWeight: '500' },
  datePickerSpinner: { height: 200 },
});

export default TaskDetailsModal;