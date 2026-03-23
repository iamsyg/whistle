// frontend/components/SplitsTab.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FloatingActionButton from '@/components/FloatingActionButton';
import CreateSplitModal from '@/components/chat/split/CreateSplitModal';
import { useFetchSplitList } from '@/hooks/chat/split/useFetchSplitList';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { SplitListItem } from '@/types/chat/split/splitListItem';
import { usePaySplit } from '@/hooks/chat/split/usePaySplit';
import { useSettleSplit } from '@/hooks/chat/split/useSettleSplit';
import SplitDetailsModal from '@/components/chat/split/SplitDetailsModal'; // Add this import

interface SplitsTabProps {
  isDarkMode?: boolean;
  onModalOpenChange?: (isOpen: boolean) => void;
}

const SplitsTab: React.FC<SplitsTabProps> = ({ isDarkMode = false, onModalOpenChange }) => {

  // const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'settled'>('all');
  const [createVisible, setCreateVisible] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<SplitListItem | null>(null); // Add this state

  const [loadingSplitId, setLoadingSplitId] = useState<string | null>(null);

  const chatId = useSelector(
    (state: RootState) => state.conversation.selectedChatId
  );

  const myId = useSelector(
    (state: RootState) => state.profile.userId
  );

  const { fetchSplitList, loading } = useFetchSplitList(chatId || '');
  const { paySplit } = usePaySplit(chatId || '');
  const { settleSplit } = useSettleSplit(chatId || '');

  const splitList = useSelector(
    (state: RootState) => state.splitList.splitListsByChatId[chatId || ''] || []
  );

  const C = {
    bg: isDarkMode ? '#0D1418' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    sub: isDarkMode ? '#A0A0A0' : '#666666',
    border: isDarkMode ? '#2A3942' : '#F0F0F0',
    card: isDarkMode ? '#1F2C34' : '#FFFFFF',
    accent: isDarkMode ? '#00A884' : '#008069',
    filterBg: isDarkMode ? '#253038' : '#F0F0F0',
  };

  useEffect(() => {
    fetchSplitList();
  }, []);

  const openModal = () => {
    setCreateVisible(true);
    onModalOpenChange?.(true);
  };

  const closeModal = () => {
    setCreateVisible(false);
    onModalOpenChange?.(false);
  };

  const handleMarkAsPaid = async (splitId: string, memberId: string) => {
    // Implement your API call here to mark a member's share as paid
    // This would typically call an endpoint that updates the split_member status
    console.log(`Marking member ${memberId} in split ${splitId} as paid`);
    
    // After successful API call, refresh the split list
    await fetchSplitList();
  };

  const yourShare = (split: SplitListItem) => {
    if (split.paid_by_user_info?.id === myId) {
      return `You paid ₹${split.total_amount.toLocaleString()}`;
    }
    const myMember = split.split_members?.find(m => m.user_id === myId);
    const owed = myMember?.amount_owed ?? split.total_amount / split.split_members_count;
    return `You owe ₹${Math.round(owed).toLocaleString()}`;
  };

  // ── Pay Now handler ──────────────────────────────────────────────────────
  const handlePayNow = async (splitId: string) => {
    setLoadingSplitId(splitId);
    try {
      await paySplit(splitId);
    } catch (err: any) {
      Alert.alert('Payment failed', err?.message ?? 'Something went wrong.');
    } finally {
      setLoadingSplitId(null);
    }
  };
 
  // ── Settle Split handler ─────────────────────────────────────────────────
  const handleSettle = (splitId: string) => {
    Alert.alert(
      'Settle Split',
      'This will mark all pending payments as settled. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle',
          style: 'destructive',
          onPress: async () => {
            setLoadingSplitId(splitId);
            try {
              await settleSplit(splitId);
            } catch (err: any) {
              Alert.alert('Failed to settle', err?.message ?? 'Something went wrong.');
            } finally {
              setLoadingSplitId(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: SplitListItem }) => {

    const myMemberEntry = item.split_members?.find(m => m.user_id === myId);
    // CHANGE 1: derive isInvolved — user is involved only if they appear in split_members
    const isInvolved = !!myMemberEntry;
    const isPayer = item.paid_by_user_info?.id === myId;
    const canCurrentUserPay = item.can_pay === true;

    const thisCardLoading = loadingSplitId === item.id;

    return (
      <TouchableOpacity
        style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}
        activeOpacity={0.7}
        onPress={() => setSelectedSplit(item)}
      >
        <View style={s.cardHeader}>
          <View style={s.titleRow}>
            <Ionicons name="receipt-outline" size={18} color={C.sub} />
            <Text style={[s.cardTitle, { color: C.text }]}>{item.title}</Text>
          </View>
 
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {!isInvolved && (
              <View style={[s.badge, { backgroundColor: `${C.sub}18` }]}>
                <Text style={[s.badgeText, { color: C.sub }]}>NOT INVOLVED</Text>
              </View>
            )}
            <View style={[s.badge, { backgroundColor: item.status === 'settled' ? `${C.accent}20` : '#FF950020' }]}>
              <Text style={[s.badgeText, { color: item.status === 'settled' ? C.accent : '#FF9500' }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
 
        <View style={s.amountRow}>
          <Text style={[s.amount, { color: C.text }]}>₹{item.total_amount.toLocaleString()}</Text>
          <Text style={[s.paidBy, { color: C.sub }]}>Paid by {item.paid_by_user_info?.name}</Text>
        </View>
 
        {isInvolved && (
          <Text style={[s.share, { color: C.sub }]}>{yourShare(item)}</Text>
        )}
 
        <View style={s.footer}>
          <View style={s.peopleRow}>
            <Ionicons name="people-outline" size={13} color={C.sub} />
            <Text style={[s.footerText, { color: C.sub }]}> {item.split_members_count} people</Text>
          </View>
          <Text style={[s.footerText, { color: C.sub }]}>{item.created_at}</Text>
        </View>
 
        {isInvolved && item.status === 'pending' && (
          <View style={s.actions}>
            {isPayer ? (
              // ── Payer: Settle Split ────────────────────────────────────
              <TouchableOpacity
                style={[s.settleBtn, { backgroundColor: thisCardLoading ? C.filterBg : C.accent }]}
                activeOpacity={0.75}
                disabled={thisCardLoading}
                onPress={(e) => { e.stopPropagation(); handleSettle(item.id); }}
              >
                {thisCardLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={[s.settleBtnText, { color: '#fff' }]}>Settle Split</Text>
                }
              </TouchableOpacity>
            ) : (
              // ── Non-payer: Pay Now / Already Paid ─────────────────────
              <TouchableOpacity
                style={[
                  s.settleBtn,
                  { backgroundColor: canCurrentUserPay && !thisCardLoading ? C.accent : C.filterBg },
                ]}
                activeOpacity={canCurrentUserPay ? 0.75 : 1}
                disabled={!canCurrentUserPay || thisCardLoading}
                onPress={(e) => { e.stopPropagation(); handlePayNow(item.id); }}
              >
                {thisCardLoading
                  ? <ActivityIndicator size="small" color={C.accent} />
                  : (
                    <Text style={[s.settleBtnText, { color: canCurrentUserPay ? '#fff' : C.sub }]}>
                      {canCurrentUserPay ? 'Pay Now' : 'Already Paid'}
                    </Text>
                  )
                }
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.remindBtn, { borderColor: C.border }]}
              activeOpacity={0.75}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={[s.remindBtnText, { color: C.sub }]}>Remind</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };
 
  return (
    <View style={[s.container, { backgroundColor: C.bg }]}>
      <View style={s.filters}>
        {(['all', 'pending', 'settled'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterBtn, { backgroundColor: filter === f ? C.accent : C.filterBg }]}
            onPress={() => setFilter(f)}
            activeOpacity={0.75}
          >
            <Text style={[s.filterText, { color: filter === f ? '#fff' : C.sub }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
 
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.accent} /></View>
      ) : (
        <FlatList
          data={splitList.filter(item => filter === 'all' ? true : item.status === filter)}
          renderItem={renderItem}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="receipt-outline" size={60} color={C.border} />
              <Text style={[s.emptyTitle, { color: C.sub }]}>No splits yet</Text>
              <Text style={[s.emptySub, { color: C.border }]}>
                {filter === 'all' ? 'Tap + to create an expense split' : `No ${filter} splits`}
              </Text>
            </View>
          }
        />
      )}
 
      <FloatingActionButton onPress={openModal} iconName="add" backgroundColor={C.accent} size={56} bottom={24} right={20} />
 
      <CreateSplitModal
        visible={createVisible}
        onClose={closeModal}
        isDarkMode={isDarkMode}
      />
 
      <SplitDetailsModal
        visible={!!selectedSplit}
        split={selectedSplit}
        onClose={() => setSelectedSplit(null)}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

export default SplitsTab;

const s = StyleSheet.create({
  container: { 
    flex: 1 
  },
  filters: { 
    flexDirection: 'row', 
    padding: 12, 
    gap: 8 
  },
  filterBtn: { 
    paddingHorizontal: 16, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  filterText: { 
    fontSize: 13, 
    fontWeight: '500' 
  },
  list: { 
    padding: 12, 
    gap: 12 
  },
  card: { 
    borderRadius: 12, 
    borderWidth: 1, 
    padding: 14, 
    gap: 8 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  titleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  cardTitle: { 
    fontSize: 15, 
    fontWeight: '600' 
  },
  badge: { 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 10 
  },
  badgeText: { 
    fontSize: 11, 
    fontWeight: '700' 
  },
  amountRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'baseline' 
  },
  amount: { 
    fontSize: 20, 
    fontWeight: '700' 
  },
  paidBy: { 
    fontSize: 13 
  },
  share: { 
    fontSize: 13 
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 4 
  },
  peopleRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  footerText: { 
    fontSize: 12 
  },
  actions: { 
    flexDirection: 'row', 
    gap: 8, 
    marginTop: 4 
  },
  settleBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  settleBtnText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 14 
  },
  remindBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 8, 
    alignItems: 'center', 
    borderWidth: 1 
  },
  remindBtnText: { 
    fontWeight: '600', 
    fontSize: 14 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  empty: { 
    alignItems: 'center', 
    marginTop: 80, 
    gap: 8 
  },
  emptyTitle: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  emptySub: { 
    fontSize: 13 
  },
});