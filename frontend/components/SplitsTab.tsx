// frontend/components/SplitsTab.tsx

import React, { useState, useEffect } from 'react';
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
import FloatingActionButton from '@/components/FloatingActionButton';
import CreateSplitModal from '@/components/chat/split/CreateSplitModal';
import type { CreateSplitResult } from '@/components/chat/split/CreateSplitModal';

interface Split {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
  status: 'pending' | 'settled';
  createdAt: Date;
}

interface SplitsTabProps {
  isDarkMode?: boolean;
  /** Notify parent when CreateSplitModal opens/closes so it can disable background swipe */
  onModalOpenChange?: (isOpen: boolean) => void;
}

const MOCK_SPLITS: Split[] = [
  {
    id: '1',
    description: 'Dinner at Restaurant',
    amount: 4250,
    paidBy: 'You',
    participants: ['You', 'John', 'Jane'],
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000)
  },
  {
    id: '2',
    description: 'Movie Tickets',
    amount: 1800,
    paidBy: 'John',
    participants: ['You', 'John'],
    status: 'settled',
    createdAt: new Date(Date.now() - 172800000)
  },
  {
    id: '3',
    description: 'Road Trip Fuel',
    amount: 3200,
    paidBy: 'Jane',
    participants: ['You', 'John', 'Jane', 'Bob'],
    status: 'pending',
    createdAt: new Date(Date.now() - 259200000)
  },
  {
    id: '4',
    description: 'Groceries',
    amount: 1560,
    paidBy: 'You',
    participants: ['You', 'Jane'],
    status: 'settled',
    createdAt: new Date(Date.now() - 345600000)
  },
];

const SplitsTab: React.FC<SplitsTabProps> = ({ isDarkMode = false, onModalOpenChange }) => {

  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'settled'>('all');
  const [createVisible, setCreateVisible] = useState(false);

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
    loadSplits();
  }, [filter]);

  const loadSplits = () => {
    setLoading(true);
    setTimeout(() => {
      setSplits(filter === 'all' ? MOCK_SPLITS : MOCK_SPLITS.filter(s => s.status === filter));
      setLoading(false);
    }, 400);
  };

  const openModal = () => {
    setCreateVisible(true);
    onModalOpenChange?.(true);
  };

  const closeModal = () => {
    setCreateVisible(false);
    onModalOpenChange?.(false);
  };

  const handleCreateSplit = (result: CreateSplitResult) => {
    console.log('New split:', result);
    closeModal();
  };

  const yourShare = (split: Split) => {
    const share = split.amount / split.participants.length;
    return split.paidBy === 'You'
      ? `You paid ₹${split.amount.toLocaleString()}`
      : `You owe ₹${Math.round(share).toLocaleString()}`;
  };

  const renderItem = ({ item }: { item: Split }) => (
    <TouchableOpacity style={[s.card, { backgroundColor: C.card, borderColor: C.border }]} activeOpacity={0.7}>
      <View style={s.cardHeader}>

        <View style={s.titleRow}>
          <Ionicons name="receipt-outline" size={18} color={C.sub} />
          <Text style={[s.cardTitle, { color: C.text }]}>{item.description}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: item.status === 'settled' ? `${C.accent}20` : '#FF950020' }]}>
          <Text style={[s.badgeText, { color: item.status === 'settled' ? C.accent : '#FF9500' }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={s.amountRow}>
        <Text style={[s.amount, { color: C.text }]}>₹{item.amount.toLocaleString()}</Text>
        <Text style={[s.paidBy, { color: C.sub }]}>Paid by {item.paidBy}</Text>
      </View>
      <Text style={[s.share, { color: C.sub }]}>{yourShare(item)}</Text>

      <View style={s.footer}>
        <View style={s.peopleRow}>
          <Ionicons name="people-outline" size={13} color={C.sub} />
          <Text style={[s.footerText, { color: C.sub }]}> {item.participants.length} people</Text>
        </View>
        <Text style={[s.footerText, { color: C.sub }]}>{item.createdAt.toLocaleDateString()}</Text>
      </View>

      {item.status === 'pending' && (
        <View style={s.actions}>
          <TouchableOpacity style={[s.settleBtn, { backgroundColor: C.accent }]} activeOpacity={0.75}>
            <Text style={s.settleBtnText}>Settle Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.remindBtn, { borderColor: C.border }]} activeOpacity={0.75}>
            <Text style={[s.remindBtnText, { color: C.sub }]}>Remind</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

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
          data={splits}
          renderItem={renderItem}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }}
              tintColor={C.accent} colors={[C.accent]}
            />
          }
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
        onCreateSplit={handleCreateSplit}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100
  },
  card: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 7
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  badgeText:
  {
    fontSize: 10,
    fontWeight: '700'
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  amount: {
    fontSize: 22,
    fontWeight: '700'
  },
  paidBy: {
    fontSize: 12
  },
  share: {
    fontSize: 13,
    marginBottom: 10
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
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
    gap: 8
  },
  settleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center'
  },
  settleBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  remindBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
    borderWidth: 1
  },
  remindBtnText: {
    fontSize: 14,
    fontWeight: '600'
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600'
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24
  },
});

export default SplitsTab;