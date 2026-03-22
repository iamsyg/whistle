// frontend/components/chat/split/SplitDetailsModal.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { SplitListItem, Members } from '@/types/chat/split/splitListItem';

interface SplitDetailsModalProps {
  visible: boolean;
  split: SplitListItem | null;
  onClose: () => void;
  isDarkMode?: boolean;
  onMarkAsPaid?: (splitId: string, memberId: string) => Promise<void>;
}

const SplitDetailsModal: React.FC<SplitDetailsModalProps> = ({
  visible,
  split,
  onClose,
  isDarkMode = false,
  onMarkAsPaid,
}) => {
  const [processingMember, setProcessingMember] = useState<string | null>(null);
  const myId = useSelector((state: RootState) => state.profile.userId);

  if (!split) return null;

  const C = {
    bg: isDarkMode ? '#0D1418' : '#FFFFFF',
    modalBg: isDarkMode ? '#1F2C34' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    sub: isDarkMode ? '#A0A0A0' : '#666666',
    border: isDarkMode ? '#2A3942' : '#F0F0F0',
    accent: isDarkMode ? '#00A884' : '#008069',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
  };

  const isPayer = split.paid_by_user_info?.id === myId;
  const currentUserMember = split.split_members?.find(m => m.user_id === myId);
  const isInvolved = !!currentUserMember;

  const handleMarkAsPaid = async (member: Members) => {
    if (!onMarkAsPaid || !split) return;
    
    if (member.status === 'paid') {
      Alert.alert('Already Paid', `${member.name} has already paid their share.`);
      return;
    }

    Alert.alert(
      'Mark as Paid',
      `Mark ${member.name}'s share as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setProcessingMember(member.user_id);
            try {
              await onMarkAsPaid(split.id, member.user_id);
            } catch (error) {
              Alert.alert('Error', 'Failed to mark as paid. Please try again.');
            } finally {
              setProcessingMember(null);
            }
          },
        },
      ]
    );
  };

  const renderMemberItem = (member: Members) => {
    const isCurrentUser = member.user_id === myId;
    const isSettled = member.status === 'paid';
    const canMarkAsPaid = isPayer && !isSettled && member.user_id !== myId;
    const isProcessing = processingMember === member.user_id;

    return (
      <TouchableOpacity
        key={member.user_id}
        style={[
          s.memberCard,
          { backgroundColor: C.modalBg, borderColor: C.border },
          canMarkAsPaid && s.clickableMember,
        ]}
        onPress={() => canMarkAsPaid && handleMarkAsPaid(member)}
        activeOpacity={canMarkAsPaid ? 0.7 : 1}
        disabled={!canMarkAsPaid || isProcessing}
      >
        <View style={s.memberInfo}>
          <View style={[s.memberAvatar, { backgroundColor: `${C.accent}20` }]}>
            <Text style={[s.memberInitial, { color: C.accent }]}>
              {member.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={s.memberDetails}>
            <Text style={[s.memberName, { color: C.text }]}>
              {member.name}
              {isCurrentUser && <Text style={[s.youBadge, { color: C.sub }]}> (You)</Text>}
            </Text>
            <Text style={[s.memberAmount, { color: C.sub }]}>
              ₹{Math.round(member.amount_owed).toLocaleString()}
            </Text>
          </View>
        </View>
        
        <View style={s.memberStatus}>
          {isSettled ? (
            <View style={[s.statusBadge, { backgroundColor: `${C.success}20` }]}>
              <Ionicons name="checkmark-circle" size={14} color={C.success} />
              <Text style={[s.statusText, { color: C.success }]}>Paid</Text>
            </View>
          ) : (
            <View style={[s.statusBadge, { backgroundColor: `${C.warning}20` }]}>
              <Ionicons name="time-outline" size={14} color={C.warning} />
              <Text style={[s.statusText, { color: C.warning }]}>Pending</Text>
            </View>
          )}
          
          {isProcessing && <ActivityIndicator size="small" color={C.accent} />}
          
          {canMarkAsPaid && !isSettled && (
            <Ionicons name="chevron-forward" size={20} color={C.sub} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getSplitStatusColor = () => {
    if (split.status === 'settled') return C.success;
    return C.warning;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.overlay}>
          <TouchableWithoutFeedback>
            <View style={[s.modalContainer, { backgroundColor: C.modalBg }]}>
              {/* Header */}
              <View style={[s.header, { borderBottomColor: C.border }]}>
                <TouchableOpacity onPress={onClose} style={s.closeButton}>
                  <Ionicons name="close" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={[s.headerTitle, { color: C.text }]}>Split Details</Text>
                <View style={s.placeholder} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Split Title and Status */}
                <View style={s.titleSection}>
                  <Text style={[s.title, { color: C.text }]}>{split.title}</Text>
                  <View style={[s.statusChip, { backgroundColor: `${getSplitStatusColor()}20` }]}>
                    <Text style={[s.statusChipText, { color: getSplitStatusColor() }]}>
                      {split.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Amount Section */}
                <View style={[s.amountSection, { backgroundColor: `${C.accent}10` }]}>
                  <Text style={[s.amountLabel, { color: C.sub }]}>Total Amount</Text>
                  <Text style={[s.totalAmount, { color: C.text }]}>
                    ₹{split.total_amount.toLocaleString()}
                  </Text>
                  <Text style={[s.paidByText, { color: C.sub }]}>
                    Paid by {split.paid_by_user_info?.name}
                  </Text>
                </View>

                {/* Members Section */}
                <View style={s.membersSection}>
                  <View style={s.sectionHeader}>
                    <Ionicons name="people-outline" size={20} color={C.accent} />
                    <Text style={[s.sectionTitle, { color: C.text }]}>
                      Split Members ({split.split_members_count})
                    </Text>
                  </View>
                  
                  <View style={s.membersList}>
                    {split.split_members?.map(renderMemberItem)}
                  </View>
                </View>

                {/* Date Section */}
                <View style={s.dateSection}>
                  <Ionicons name="calendar-outline" size={16} color={C.sub} />
                  <Text style={[s.dateText, { color: C.sub }]}>{split.created_at}</Text>
                </View>

                {/* Info for non-involved users */}
                {!isInvolved && (
                  <View style={[s.infoBanner, { backgroundColor: `${C.sub}10` }]}>
                    <Ionicons name="information-circle-outline" size={20} color={C.sub} />
                    <Text style={[s.infoText, { color: C.sub }]}>
                      You are not involved in this split.
                    </Text>
                  </View>
                )}

                {/* Footer note for payer */}
                {isPayer && split.status === 'pending' && (
                  <View style={[s.footerNote, { backgroundColor: `${C.accent}10` }]}>
                    <Ionicons name="hand-left-outline" size={16} color={C.accent} />
                    <Text style={[s.footerNoteText, { color: C.accent }]}>
                      Tap on any member to mark their share as paid
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  placeholder: {
    width: 32,
  },
  titleSection: {
    padding: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountSection: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  paidByText: {
    fontSize: 13,
  },
  membersSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  membersList: {
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  clickableMember: {
    cursor: 'pointer',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: '600',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  youBadge: {
    fontSize: 12,
    fontWeight: 'normal',
  },
  memberAmount: {
    fontSize: 13,
  },
  memberStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  notesSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 13,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 20,
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 20,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  footerNoteText: {
    fontSize: 12,
  },
});

export default SplitDetailsModal;