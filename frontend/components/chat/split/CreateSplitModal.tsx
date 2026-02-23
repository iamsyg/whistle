// frontend/components/chat/split/CreateSplitModal.tsx
//
//  • Single scrollable sheet – no step navigation
//  • Amount + title at top
//  • All members listed (including yourself, pre-selected & non-removable)
//  • Split type toggle: Equally | Unequally
//  • Live per-member amount shown inline
//
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

// ─── Types 
type SplitType = 'equally' | 'unequally';

interface MemberRow {
  user_id: string;
  name: string | null;
  username: string | null;
  isMe: boolean;
  selected: boolean;
  /** editable in unequally mode */
  amount: string;
}

export interface CreateSplitResult {
  title: string;
  totalAmount: number;
  splitType: SplitType;
  members: { user_id: string; amount: number }[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreateSplit: (result: CreateSplitResult) => void;
  isDarkMode?: boolean;
}

// ─── Helpers 
const getInitials = (name: string | null, username: string | null) =>
  (name || username || '?').slice(0, 2).toUpperCase();

const fmtINR = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Avatar 
const Avatar = ({
  name,
  username,
  size = 40,
  accentColor,
  bgColor,
}: {
  name: string | null;
  username: string | null;
  size?: number;
  accentColor: string;
  bgColor: string;
}) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: bgColor,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Text style={{ color: accentColor, fontSize: size * 0.33, fontWeight: '700' }}>
      {getInitials(name, username)}
    </Text>
  </View>
);

// ─── Component 
const CreateSplitModal: React.FC<Props> = ({
  visible,
  onClose,
  onCreateSplit,
  isDarkMode = false,
}) => {

  // ── Theme 
  const C = useMemo(
    () => ({
      bg: isDarkMode ? '#1F2C34' : '#FFFFFF',
      text: isDarkMode ? '#FFFFFF' : '#111111',
      sub: isDarkMode ? '#8A9BA8' : '#6B7280',
      border: isDarkMode ? '#2E3D47' : '#E5E7EB',
      accent: isDarkMode ? '#00A884' : '#008069',
      accentBg: isDarkMode ? '#00A88414' : '#00806910',
      inputBg: isDarkMode ? '#253038' : '#F3F4F6',
      handle: isDarkMode ? '#3A4A54' : '#D1D5DB',
      danger: '#EF4444',
      avatarBg: isDarkMode ? '#2A3942' : '#E8F5F3',
    }),
    [isDarkMode]
  );

  // ── Redux 
  const myUserId = useSelector((s: RootState) => s.profile.userId);
  const myProfile = useSelector((s: RootState) => s.profile);
  const selectedChatId = useSelector((s: RootState) => s.conversation.selectedChatId);
  const membersByChatId = useSelector((s: RootState) => s.chatMembers.membersByChatId);

  const chatMembers = useMemo(
    () => (selectedChatId ? membersByChatId[selectedChatId] ?? [] : []),
    [selectedChatId, membersByChatId]
  );

  // ── Form state 
  const [totalAmount, setTotalAmount] = useState('');
  const [title, setTitle] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equally');

  const buildRows = useCallback((): MemberRow[] => {
    const meRow: MemberRow = {
      user_id: myUserId ?? 'me',
      name: myProfile.name ?? 'You',
      username: myProfile.userName ?? null,
      isMe: true,
      selected: true,
      amount: '',
    };

    const others: MemberRow[] = chatMembers
      .filter(m => m.user_id !== myUserId)
      .map(m => ({
        user_id: m.user_id,
        name: m.name,
        username: m.username,
        isMe: false,
        selected: false,
        amount: '',
      }));

    return [meRow, ...others];
  }, [myUserId, myProfile, chatMembers]);

  const [rows, setRows] = useState<MemberRow[]>([]);

  useEffect(() => {
    if (visible) setRows(buildRows());
  }, [visible, buildRows]);

  // ── Derived 
  const parsed = parseFloat(totalAmount) || 0;
  const selectedRows = rows.filter(r => r.selected);
  const n = selectedRows.length;

  const computedAmounts = useMemo<Record<string, number>>(() => {
    if (parsed <= 0 || n === 0) return {};
    if (splitType === 'equally') {
      const share = Math.floor((parsed / n) * 100) / 100;
      return Object.fromEntries(selectedRows.map(r => [r.user_id, share]));
    }
    // unequally – use whatever the user typed
    return Object.fromEntries(
      selectedRows.map(r => [r.user_id, parseFloat(r.amount) || 0])
    );
  }, [rows, splitType, parsed, n]);

  const { remaining, isBalanced } = useMemo(() => {
    if (splitType !== 'unequally' || parsed <= 0) return { remaining: 0, isBalanced: true };
    const sum = selectedRows.reduce((a, r) => a + (parseFloat(r.amount) || 0), 0);
    const rem = parsed - sum;
    return { remaining: rem, isBalanced: Math.abs(rem) < 0.005 };
  }, [rows, splitType, parsed]);

  // ── Handlers 
  const toggleRow = (userId: string) => {
    setRows(prev =>
      prev.map(r =>
        r.user_id === userId && !r.isMe ? { ...r, selected: !r.selected } : r
      )
    );
  };

  const updateAmount = (userId: string, val: string) => {
    setRows(prev =>
      prev.map(r => (r.user_id === userId ? { ...r, amount: val } : r))
    );
  };

  const handleCreate = () => {
    if (parsed <= 0) {
      Alert.alert('Enter amount', 'Please enter a valid total amount.');
      return;
    }
    if (selectedRows.filter(r => !r.isMe).length === 0) {
      Alert.alert('Select members', 'Choose at least one other person to split with.');
      return;
    }
    if (splitType === 'unequally' && !isBalanced) {
      Alert.alert(
        "Amounts don't balance",
        `₹${Math.abs(remaining).toFixed(2)} ${remaining > 0 ? 'still unassigned' : 'over-assigned'}.`
      );
      return;
    }

    const members = selectedRows.map(r => ({
      user_id: r.user_id,
      amount: computedAmounts[r.user_id] ?? 0,
    }));

    onCreateSplit({ title: title.trim(), totalAmount: parsed, splitType, members });
    handleReset();
  };

  const handleReset = () => {
    setTotalAmount('');
    setTitle('');
    setSplitType('equally');
    setRows(buildRows());
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };


  // RENDER
 
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={st.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={st.kav}
        >
          <View style={[st.sheet, { backgroundColor: C.bg }]}>
            {/* Handle */}
            <View style={[st.handle, { backgroundColor: C.handle }]} />

            {/* ── Header ── */}
            <View style={st.header}>
              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={C.sub} />
              </TouchableOpacity>
              <Text style={[st.headerTitle, { color: C.text }]}>Split expense</Text>
              <TouchableOpacity
                onPress={handleCreate}
                style={[
                  st.doneBtn,
                  { backgroundColor: parsed > 0 && n > 1 ? C.accent : C.border },
                ]}
                activeOpacity={0.85}
                disabled={!(parsed > 0 && n > 1)}
              >
                <Text style={[st.doneBtnText, { color: parsed > 0 && n > 1 ? '#fff' : C.sub }]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* ── Amount ── */}
              <View style={[st.amountRow, { borderBottomColor: C.border }]}>
                <Text style={[st.rupeeSymbol, { color: C.accent }]}>₹</Text>
                <TextInput
                  style={[st.amountInput, { color: C.text }]}
                  value={totalAmount}
                  onChangeText={setTotalAmount}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={C.sub}
                  autoFocus
                />
              </View>

              {/* ── Title ── */}
              <View style={[st.titleRow, { borderBottomColor: C.border }]}>
                <Ionicons name="pencil-outline" size={16} color={C.sub} style={{ marginRight: 8 }} />
                <TextInput
                  style={[st.titleInput, { color: C.text }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Add a note (optional)"
                  placeholderTextColor={C.sub}
                  returnKeyType="done"
                />
              </View>

              {/* ── Split type toggle ── */}
              <View style={[st.splitToggleWrap, { borderBottomColor: C.border }]}>
                {(
                  [
                    { id: 'equally', label: 'Equally' },
                    { id: 'unequally', label: 'Unequally' },
                  ] as { id: SplitType; label: string }[]
                ).map(opt => {
                  const active = splitType === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setSplitType(opt.id)}
                      style={[
                        st.splitToggleBtn,
                        { backgroundColor: active ? C.accent : C.inputBg },
                      ]}
                      activeOpacity={0.75}
                    >
                      <Text style={[st.splitToggleText, { color: active ? '#fff' : C.sub }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Balance indicator (unequal only) ── */}
              {splitType === 'unequally' && parsed > 0 && (
                <View
                  style={[
                    st.balanceRow,
                    { backgroundColor: isBalanced ? C.accentBg : `${C.danger}14` },
                  ]}
                >
                  <Ionicons
                    name={isBalanced ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                    size={15}
                    color={isBalanced ? C.accent : C.danger}
                  />
                  <Text style={[st.balanceText, { color: isBalanced ? C.accent : C.danger }]}>
                    {isBalanced
                      ? 'Amounts balanced'
                      : remaining > 0
                        ? `₹${fmtINR(remaining)} left to assign`
                        : `₹${fmtINR(Math.abs(remaining))} over-assigned`}
                  </Text>
                </View>
              )}

              {/* ── Members list ── */}
              <View style={{ paddingHorizontal: 16 }}>
                {rows.map(row => {
                  const amt = computedAmounts[row.user_id];
                  const showAmt = row.selected && parsed > 0 && splitType === 'equally';

                  return (
                    <TouchableOpacity
                      key={row.user_id}
                      onPress={() => toggleRow(row.user_id)}
                      activeOpacity={row.isMe ? 1 : 0.7}
                      style={st.memberRow}
                    >
                      <Avatar
                        name={row.isMe ? 'You' : row.name}
                        username={row.username}
                        accentColor={C.accent}
                        bgColor={C.avatarBg}
                      />

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[st.memberName, { color: C.text }]} numberOfLines={1}>
                          {row.isMe ? 'You' : (row.name || row.username || 'Unknown')}
                        </Text>
                        {showAmt && (
                          <Text style={[st.memberAmt, { color: C.accent }]}>
                            ₹{fmtINR(amt)}
                          </Text>
                        )}
                      </View>

                      {/* Right side: amount input (unequally) OR checkbox */}
                      {splitType === 'unequally' && row.selected ? (
                        <View
                          style={[
                            st.amountChip,
                            { borderColor: C.border, backgroundColor: C.inputBg },
                          ]}
                        >
                          <Text style={[st.chipRupee, { color: C.sub }]}>₹</Text>
                          <TextInput
                            style={[st.chipInput, { color: C.text }]}
                            value={row.amount}
                            onChangeText={v => updateAmount(row.user_id, v)}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={C.sub}
                          />
                        </View>
                      ) : (
                        <View
                          style={[
                            st.checkbox,
                            {
                              borderColor: row.selected ? C.accent : C.border,
                              backgroundColor: row.selected ? C.accent : 'transparent',
                              opacity: row.isMe ? 0.5 : 1,
                            },
                          ]}
                        >
                          {row.selected && <Ionicons name="checkmark" size={13} color="#fff" />}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const st = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  kav: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    minHeight: '60%',
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  rupeeSymbol: {
    fontSize: 28,
    fontWeight: '700',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '700',
    padding: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  titleInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  splitToggleWrap: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  splitToggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  splitToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  balanceText: {
    fontSize: 13,
    fontWeight: '500',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '500',
  },
  memberAmt: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    minWidth: 100,
  },
  chipRupee: {
    fontSize: 14,
    marginRight: 2,
  },
  chipInput: {
    fontSize: 15,
    fontWeight: '600',
    width: 75,
    padding: 0,
  },
});

export default CreateSplitModal;