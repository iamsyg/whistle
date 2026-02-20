// frontend/components/chat/task/AddAssigneeSheet.tsx

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



interface AddAssigneeSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (member: ChatMember) => void;
  existingIds: string[];
  chatId: string;
  theme: Record<string, string>;
}

/** Deterministic avatar colour from a name string */
export const avatarColor = (name: string | null) => {
  const colours = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5AC8FA'];
  if (!name) return colours[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colours[Math.abs(hash) % colours.length];
};

export const initials = (name: string | null) => {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
};

const { width, height } = Dimensions.get('window');




// ── Add Assignee Sheet ─────────────────────────────────────────────────────────

const AddAssigneeSheet: React.FC<AddAssigneeSheetProps> = ({
  visible, onClose, onAdd, existingIds, chatId, theme,
}) => {
  const [search, setSearch] = useState('');

  const allMembers = useSelector((state: RootState) =>
    state.chatMembers.membersByChatId[chatId] ?? []
  );

  const available = allMembers.filter(m =>
    !existingIds.includes(m.user_id) &&
    (search.trim() === '' ||
      (m.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (m.username ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const handleAdd = (member: ChatMember) => {
    onAdd(member);
    setSearch('');
    onClose();
  };
  
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      {/* Backdrop */}
      <TouchableOpacity style={addStyles.backdrop} activeOpacity={1} onPress={handleClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={addStyles.kavWrapper}
      >
        <View style={[addStyles.sheet, { backgroundColor: theme.background }]}>
          {/* Handle */}
          <View style={addStyles.handleRow}>
            <View style={[addStyles.handle, { backgroundColor: theme.border }]} />
          </View>

          {/* Header */}
          <View style={[addStyles.header, { borderBottomColor: theme.border }]}>
            <Text style={[addStyles.title, { color: theme.text }]}>Add Assignee</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[addStyles.searchRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={17} color={theme.textSecondary} />
            <TextInput
              style={[addStyles.searchInput, { color: theme.text }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search members…"
              placeholderTextColor={theme.textSecondary}
              autoFocus
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          {available.length === 0 ? (
            <View style={addStyles.empty}>
              <Ionicons name="people-outline" size={38} color={theme.textSecondary} style={{ opacity: 0.4 }} />
              <Text style={[addStyles.emptyText, { color: theme.textSecondary }]}>
                {search.length > 0 ? 'No members match your search' : 'All members are already assigned'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={available}
              keyExtractor={item => item.user_id}
              contentContainerStyle={addStyles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const color = avatarColor(item.name);
                return (
                  <TouchableOpacity
                    style={[addStyles.memberRow, { borderBottomColor: theme.border }]}
                    onPress={() => handleAdd(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[addStyles.avatar, { backgroundColor: color + '22' }]}>
                      <Text style={[addStyles.avatarText, { color }]}>{initials(item.name)}</Text>
                    </View>
                    <View style={addStyles.memberInfo}>
                      <Text style={[addStyles.memberName, { color: theme.text }]}>{item.name ?? 'Unknown'}</Text>
                      {item.username && (
                        <Text style={[addStyles.memberSub, { color: theme.textSecondary }]}>@{item.username}</Text>
                      )}
                    </View>
                    <View style={[addStyles.addBadge, { backgroundColor: theme.primary + '15' }]}>
                      <Ionicons name="add" size={15} color={theme.primary} />
                      <Text style={[addStyles.addBadgeText, { color: theme.primary }]}>Add</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          <View style={{ height: 28 }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const addStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  kavWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: height * 0.72,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 20,
  },
  handleRow: { alignItems: 'center', paddingVertical: 12 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  title: { fontSize: 17, fontWeight: '600' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginVertical: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  listContent: { paddingHorizontal: 16, paddingBottom: 8 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '600' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  memberSub: { fontSize: 12 },
  addBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
  },
  addBadgeText: { fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 44, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '500', textAlign: 'center', paddingHorizontal: 24 },
});

export default AddAssigneeSheet;