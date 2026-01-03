// components/SplitsTab.tsx
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
}

const SplitsTab: React.FC<SplitsTabProps> = ({ isDarkMode = false }) => {
  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'settled'>('all');

  const mockSplits: Split[] = [
    {
      id: '1',
      description: 'Dinner at Restaurant',
      amount: 4250,
      paidBy: 'You',
      participants: ['You', 'John', 'Jane'],
      status: 'pending',
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      id: '2',
      description: 'Movie Tickets',
      amount: 1800,
      paidBy: 'John',
      participants: ['You', 'John'],
      status: 'settled',
      createdAt: new Date(Date.now() - 172800000),
    },
    {
      id: '3',
      description: 'Road Trip Fuel',
      amount: 3200,
      paidBy: 'Jane',
      participants: ['You', 'John', 'Jane', 'Bob'],
      status: 'pending',
      createdAt: new Date(Date.now() - 259200000),
    },
    {
      id: '4',
      description: 'Groceries',
      amount: 1560,
      paidBy: 'You',
      participants: ['You', 'Jane'],
      status: 'settled',
      createdAt: new Date(Date.now() - 345600000),
    },
  ];

  useEffect(() => {
    loadSplits();
  }, [filter]);

  const loadSplits = () => {
    setLoading(true);
    setTimeout(() => {
      const filteredSplits = filter === 'all' 
        ? mockSplits 
        : mockSplits.filter(split => split.status === filter);
      setSplits(filteredSplits);
      setLoading(false);
    }, 500);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const calculateYourShare = (split: Split) => {
    const share = split.amount / split.participants.length;
    if (split.paidBy === 'You') {
      return `You paid ₹${split.amount.toLocaleString()}`;
    } else {
      return `You owe ₹${share.toLocaleString()}`;
    }
  };

  const renderSplitItem = ({ item }: { item: Split }) => (
    <TouchableOpacity
      style={[
        styles.splitCard,
        {
          backgroundColor: isDarkMode ? '#1F2C34' : '#FFFFFF',
          borderColor: isDarkMode ? '#2A3942' : '#F0F0F0',
        },
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.splitHeader}>
        <View style={styles.splitTitleRow}>
          <Ionicons 
            name="receipt-outline" 
            size={20} 
            color={isDarkMode ? '#A0A0A0' : '#666666'} 
          />
          <Text style={[
            styles.splitTitle,
            { color: isDarkMode ? '#FFFFFF' : '#000000' }
          ]}>
            {item.description}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { 
            backgroundColor: item.status === 'settled' 
              ? (isDarkMode ? '#00A88420' : '#00806920')
              : (isDarkMode ? '#FF950020' : '#FF950020')
          }
        ]}>
          <Text style={[
            styles.statusText,
            { 
              color: item.status === 'settled' 
                ? (isDarkMode ? '#00A884' : '#008069')
                : (isDarkMode ? '#FF9500' : '#FF9500')
            }
          ]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.amountContainer}>
        <Text style={[
          styles.amount,
          { color: isDarkMode ? '#FFFFFF' : '#000000' }
        ]}>
          ₹{item.amount.toLocaleString()}
        </Text>
        <Text style={[
          styles.paidBy,
          { color: isDarkMode ? '#A0A0A0' : '#666666' }
        ]}>
          Paid by: {item.paidBy}
        </Text>
      </View>
      
      <Text style={[
        styles.shareText,
        { color: isDarkMode ? '#A0A0A0' : '#666666' }
      ]}>
        {calculateYourShare(item)}
      </Text>
      
      <View style={styles.splitFooter}>
        <View style={styles.participantsContainer}>
          <Ionicons name="people-outline" size={14} color={isDarkMode ? '#A0A0A0' : '#666666'} />
          <Text style={[
            styles.participantsText,
            { color: isDarkMode ? '#A0A0A0' : '#666666' }
          ]}>
            {item.participants.length} people
          </Text>
        </View>
        
        <Text style={[
          styles.dateText,
          { color: isDarkMode ? '#A0A0A0' : '#666666' }
        ]}>
          {item.createdAt.toLocaleDateString()}
        </Text>
      </View>
      
      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.settleButton, { backgroundColor: isDarkMode ? '#00A884' : '#008069' }]}
            activeOpacity={0.7}
          >
            <Text style={styles.settleButtonText}>Settle Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.remindButton,
              { borderColor: isDarkMode ? '#2A3942' : '#E0E0E0' }
            ]}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.remindButtonText,
              { color: isDarkMode ? '#A0A0A0' : '#666666' }
            ]}>
              Remind
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
        {(['all', 'pending', 'settled'] as const).map((filterType) => (
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

      {/* Splits List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#00A884' : '#008069'} />
        </View>
      ) : (
        <FlatList
          data={splits}
          renderItem={renderSplitItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.splitsList}
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
              <Ionicons name="receipt-outline" size={64} color={isDarkMode ? '#2A3942' : '#E0E0E0'} />
              <Text style={[styles.emptyStateText, { color: isDarkMode ? '#A0A0A0' : '#666666' }]}>
                No splits found
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: isDarkMode ? '#2A3942' : '#E0E0E0' }]}>
                {filter === 'all' ? 'Create your first expense split' : `No ${filter} splits`}
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
  splitsList: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  splitCard: {
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
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  splitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  splitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
  },
  paidBy: {
    fontSize: 12,
  },
  shareText: {
    fontSize: 14,
    marginBottom: 12,
  },
  splitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 12,
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  settleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  settleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  remindButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  remindButtonText: {
    fontSize: 14,
    fontWeight: '600',
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

export default SplitsTab;