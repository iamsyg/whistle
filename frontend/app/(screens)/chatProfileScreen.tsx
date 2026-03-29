// frontend/app/(screens)/chatProfileScreen.tsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Share,
  Linking,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { router } from 'expo-router';
import ModalMenu, { MenuItem } from '@/components/ModalMenu';
import { useGetChatProfile } from '@/hooks/chat/profile/useGetChatProfile';
import { ChatMember } from '@/types/chat/members';
import { Contact } from '@/types/contact';
import { ProfileLink } from '@/types/profile/userProfile';

// Types

interface ChatProfileScreenProps {
  isDarkMode?: boolean;
}

// Helpers

interface ResolvedName {
  displayName: string;
  isSavedContact: boolean;
  contact: Contact | null;
}

function resolveDisplayName(
  userId: string | undefined | null,
  backendName: string | null | undefined,
  backendPhone: string | null | undefined,
  byProfileId: Record<string, Contact>,
): ResolvedName {
  if (userId) {
    const contact = byProfileId[userId] ?? null;
    if (contact) return { displayName: contact.name, isSavedContact: true, contact };
  }
  return {
    displayName: backendName || backendPhone || 'Unknown',
    isSavedContact: false,
    contact: null,
  };
}

function buildColors(isDarkMode: boolean) {
  return {
    bg: isDarkMode ? '#0D1418' : '#F5F5F5',
    cardBg: isDarkMode ? '#1F2C34' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    sub: isDarkMode ? '#A0A0A0' : '#666666',
    border: isDarkMode ? '#2A3942' : '#E0E0E0',
    accent: isDarkMode ? '#00A884' : '#008069',
    inputBg: isDarkMode ? '#2A3942' : '#F5F5F5',
    placeholder: isDarkMode ? '#6C7A7F' : '#999999',
    danger: '#E53935',
    dangerBg: isDarkMode ? '#3B1A1A' : '#FFF0F0',
  };
}

type Colors = ReturnType<typeof buildColors>;

// MemberRow

interface MemberRowProps {
  member: ChatMember;
  byProfileId: Record<string, Contact>;
  C: Colors;
  currentUserId: string;
  isCurrentUserAdmin: boolean;
  adminCount: number;
  onPress: (member: ChatMember, resolvedName: string) => void;
}

const MemberRow: React.FC<MemberRowProps> = React.memo(
  ({ member, byProfileId, C, currentUserId, isCurrentUserAdmin, adminCount, onPress }) => {
    const { displayName, isSavedContact } = resolveDisplayName(
      member.user_id,
      member.name,
      null,
      byProfileId,
    );

    const isMe = member.user_id === currentUserId;
    const label = isMe ? `${displayName} (You)` : displayName;

    const subLine =
      isSavedContact && member.name && member.name !== displayName
        ? `~${member.name}`
        : member.role === 'admin'
          ? 'Group admin'
          : null;

    const tappable = isCurrentUserAdmin && !isMe;

    return (
      <TouchableOpacity
        style={[s.memberRow, { borderBottomColor: C.border }]}
        onPress={() => tappable && onPress(member, displayName)}
        activeOpacity={tappable ? 0.7 : 1}
      >
        <View style={[s.memberAvatar, { backgroundColor: C.inputBg }]}>
          {member.avatar_url ? (
            <Image source={{ uri: member.avatar_url }} style={s.fill} />
          ) : (
            <Ionicons name="person" size={22} color={C.sub} />
          )}
        </View>

        <View style={s.memberInfo}>
          <Text style={[s.memberName, { color: C.text }]} numberOfLines={1}>
            {label}
          </Text>
          {subLine ? (
            <Text style={[s.memberSub, { color: C.sub }]} numberOfLines={1}>
              {subLine}
            </Text>
          ) : null}
        </View>

        {member.role === 'admin' ? (
          <View style={[s.adminBadge, { borderColor: C.accent }]}>
            <Text style={[s.adminBadgeText, { color: C.accent }]}>Admin</Text>
          </View>
        ) : null}

        {tappable ? (
          <Ionicons name="chevron-forward" size={16} color={C.sub} style={{ marginLeft: 8 }} />
        ) : null}
      </TouchableOpacity>
    );
  },
);

// ChatProfileScreen

const ChatProfileScreen: React.FC<ChatProfileScreenProps> = ({ isDarkMode = false }) => {
  const C = useMemo(() => buildColors(isDarkMode), [isDarkMode]);

  // Redux
  const selectedChatId = useSelector((st: RootState) => st.conversation.selectedChatId);
  const chatProfile = useSelector((st: RootState) => st.chatProfile.profilesByChatId[selectedChatId ?? '']);
  const byProfileId = useSelector((st: RootState) => st.contacts.byProfileId);
  const allContacts = useSelector((st: RootState) => st.contacts.all);

  // ── IMPORTANT: adjust this selector to match your actual auth slice path ────

  const currentUserId = useSelector((st: RootState) => st.profile.userId);

  const { getUserProfile } = useGetChatProfile(selectedChatId ?? '');

  // Derived
  const isGroup = Boolean(chatProfile?.members);

  // Find current user's role in the group members list
  const currentUserRole: 'admin' | 'member' | null = useMemo(() => {
    if (!isGroup || !chatProfile?.members || !currentUserId) return null;
    return chatProfile.members.find((m) => m.user_id === currentUserId)?.role ?? null;
  }, [chatProfile, currentUserId, isGroup]);

  const isAdmin = currentUserRole === 'admin';

  console.log('ChatProfileScreen render', { selectedChatId, chatProfile, currentUserRole, isAdmin });

  const adminCount = useMemo(
    () => chatProfile?.members?.filter((m) => m.role === 'admin').length ?? 0,
    [chatProfile],
  );

  const resolvedChat: ResolvedName | null = useMemo(() => {
    if (!chatProfile) return null;
    if (isGroup) return { displayName: chatProfile.name ?? 'Group', isSavedContact: false, contact: null };
    return resolveDisplayName(chatProfile.id, chatProfile.name, chatProfile.phone_number, byProfileId);
  }, [chatProfile, isGroup, byProfileId]);

  // Registered contacts not yet in the group — for the add-member picker
  const addableContacts = useMemo(() => {
    if (!isGroup || !chatProfile?.members) return [];
    const memberIds = new Set(chatProfile.members.map((m) => m.user_id));
    return allContacts.filter((c) => c.isRegistered && c.profileId && !memberIds.has(c.profileId));
  }, [allContacts, chatProfile, isGroup]);


  const [showMenu, setShowMenu] = useState(false);

  // Group name — inline edit in header
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const nameInputRef = useRef<TextInput>(null);

  // Description modal
  const [showDescModal, setShowDescModal] = useState(false);
  const [draftDesc, setDraftDesc] = useState('');
  const [savingDesc, setSavingDesc] = useState(false);

  // Link add modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [draftLinkTitle, setDraftLinkTitle] = useState('');
  const [draftLinkUrl, setDraftLinkUrl] = useState('');
  const [savingLink, setSavingLink] = useState(false);

  // Add member bottom sheet
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [addingMembers, setAddingMembers] = useState(false);

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => { getUserProfile(); }, [getUserProfile]);

  // Seed drafts when profile loads or changes
  useEffect(() => {
    if (chatProfile) {
      setDraftName(chatProfile.name ?? '');
      setDraftDesc(chatProfile.about ?? '');
    }
  }, [chatProfile]);

  // Handlers


  const uploadAvatar = useCallback(async (uri: string | null) => {
    setUploadingAvatar(true);
    try {
      if (uri === null) {
        // TODO: await api.updateGroup(selectedChatId, { image_url: null });
        // TODO: dispatch(setChatProfile({ chatId: selectedChatId, profile: { ...chatProfile, avatar_url: null } }));
      } else {
        // TODO: const uploadedUrl = await uploadToStorage(uri);
        // TODO: await api.updateGroup(selectedChatId, { image_url: uploadedUrl });
        // TODO: dispatch(setChatProfile({ chatId: selectedChatId, profile: { ...chatProfile, avatar_url: uploadedUrl } }));
      }
      await new Promise((r) => setTimeout(r, 1000)); // stub — remove when wired
    } catch {
      Alert.alert('Error', 'Could not update group photo.');
    } finally {
      setUploadingAvatar(false);
    }
  }, [selectedChatId]);

  const handleChangeAvatar = useCallback(() => {
    Alert.alert('Change group photo', 'Choose an option', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Take photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera permission is required.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true, aspect: [1, 1], quality: 0.8,
          });
          if (!result.canceled) uploadAvatar(result.assets[0].uri);
        },
      },
      {
        text: 'Choose from gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Gallery permission is required.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });
          if (!result.canceled) uploadAvatar(result.assets[0].uri);
        },
      },
      {
        text: 'Remove photo',
        style: 'destructive',
        onPress: () => uploadAvatar(null),
      },
    ]);
  }, [uploadAvatar]);

  // ── Group name ────────────────────────────────────────────────────────────────

  const handleSaveName = useCallback(async () => {
    if (!draftName.trim()) { Alert.alert('Error', 'Group name cannot be empty.'); return; }
    setSavingName(true);
    try {
      // TODO: await api.updateGroup(selectedChatId, { title: draftName.trim() });
      // TODO: dispatch(setChatProfile({ chatId: selectedChatId, profile: { ...chatProfile, name: draftName.trim() } }));
      await new Promise((r) => setTimeout(r, 600)); // stub
      setEditingName(false);
    } catch {
      Alert.alert('Error', 'Could not update group name.');
    } finally {
      setSavingName(false);
    }
  }, [draftName, selectedChatId]);

  const handleCancelName = useCallback(() => {
    setDraftName(chatProfile?.name ?? '');
    setEditingName(false);
  }, [chatProfile]);

  // ── Description ───────────────────────────────────────────────────────────────

  const handleSaveDesc = useCallback(async () => {
    setSavingDesc(true);
    try {
      // TODO: await api.updateGroup(selectedChatId, { description: draftDesc.trim() });
      // TODO: dispatch(setChatProfile({ chatId: selectedChatId, profile: { ...chatProfile, about: draftDesc.trim() } }));
      await new Promise((r) => setTimeout(r, 600)); // stub
      setShowDescModal(false);
    } catch {
      Alert.alert('Error', 'Could not update description.');
    } finally {
      setSavingDesc(false);
    }
  }, [draftDesc, selectedChatId]);

  // ── Links ─────────────────────────────────────────────────────────────────────

  const handleAddLink = useCallback(async () => {
    if (!draftLinkTitle.trim() || !draftLinkUrl.trim()) {
      Alert.alert('Error', 'Both title and URL are required.');
      return;
    }
    if (!/^https?:\/\/.+/.test(draftLinkUrl.trim())) {
      Alert.alert('Error', 'URL must start with http:// or https://');
      return;
    }
    setSavingLink(true);
    try {
      const newLink: ProfileLink = { key: draftLinkTitle.trim(), url: draftLinkUrl.trim() };
      const updated = [...(chatProfile?.profile_links ?? []), newLink];
      // TODO: await api.updateGroup(selectedChatId, { profile_links: updated });
      // TODO: dispatch(setChatProfile({ chatId: selectedChatId, profile: { ...chatProfile, profile_links: updated } }));
      await new Promise((r) => setTimeout(r, 600)); // stub
      setDraftLinkTitle('');
      setDraftLinkUrl('');
      setShowLinkModal(false);
    } catch {
      Alert.alert('Error', 'Could not add link.');
    } finally {
      setSavingLink(false);
    }
  }, [draftLinkTitle, draftLinkUrl, selectedChatId, chatProfile]);

  const handleRemoveLink = useCallback((link: ProfileLink) => {
    Alert.alert('Remove link', `Remove "${link.key}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = (chatProfile?.profile_links ?? []).filter((l) => l.url !== link.url);
            // TODO: await api.updateGroup(selectedChatId, { profile_links: updated });
            // TODO: dispatch(setChatProfile({ chatId: selectedChatId, profile: { ...chatProfile, profile_links: updated } }));
            await new Promise((r) => setTimeout(r, 400)); // stub
          } catch {
            Alert.alert('Error', 'Could not remove link.');
          }
        },
      },
    ]);
  }, [chatProfile, selectedChatId]);

  // ── Members ───────────────────────────────────────────────────────────────────

  const handleMemberPress = useCallback((member: ChatMember, resolvedName: string) => {
    const isTargetAdmin = member.role === 'admin';
    const isLastAdmin = isTargetAdmin && adminCount <= 1;

    const actions: any[] = [{ text: 'Cancel', style: 'cancel' }];

    if (!isTargetAdmin) {
      actions.push({
        text: 'Make group admin',
        onPress: () => Alert.alert('Make admin', `Make ${resolvedName} a group admin?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Make admin',
            onPress: async () => {
              try {
                // TODO: await api.updateMemberRole(selectedChatId, member.user_id, 'admin');
                await new Promise((r) => setTimeout(r, 400));
              } catch { Alert.alert('Error', 'Could not update role.'); }
            },
          },
        ]),
      });
    } else if (!isLastAdmin) {
      actions.push({
        text: 'Dismiss as admin',
        onPress: () => Alert.alert('Dismiss admin', `Remove admin rights from ${resolvedName}?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Dismiss',
            style: 'destructive',
            onPress: async () => {
              try {
                // TODO: await api.updateMemberRole(selectedChatId, member.user_id, 'member');
                await new Promise((r) => setTimeout(r, 400));
              } catch { Alert.alert('Error', 'Could not update role.'); }
            },
          },
        ]),
      });
    }

    actions.push({
      text: `Remove ${resolvedName}`,
      style: 'destructive',
      onPress: () => Alert.alert('Remove member', `Remove ${resolvedName} from the group?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: await api.removeMember(selectedChatId, member.user_id);
              await new Promise((r) => setTimeout(r, 400));
            } catch { Alert.alert('Error', 'Could not remove member.'); }
          },
        },
      ]),
    });

    Alert.alert(resolvedName, member.name && member.name !== resolvedName ? `~${member.name}` : '', actions);
  }, [adminCount, selectedChatId]);

  const toggleSelectContact = useCallback((profileId: string) => {
    setSelectedToAdd((prev) => {
      const next = new Set(prev);
      next.has(profileId) ? next.delete(profileId) : next.add(profileId);
      return next;
    });
  }, []);

  const handleConfirmAddMembers = useCallback(async () => {
    if (!selectedToAdd.size) return;
    setAddingMembers(true);
    try {
      // TODO: await api.addMembers(selectedChatId, Array.from(selectedToAdd));
      await new Promise((r) => setTimeout(r, 800)); // stub
      setSelectedToAdd(new Set());
      setShowAddMember(false);
    } catch {
      Alert.alert('Error', 'Could not add members.');
    } finally {
      setAddingMembers(false);
    }
  }, [selectedToAdd, selectedChatId]);

  // ── Direct chat helpers ───────────────────────────────────────────────────────

  const handleShareProfile = useCallback(async () => {
    if (!chatProfile || !resolvedChat) return;
    try {
      await Share.share({ message: resolvedChat.displayName });
    } catch { Alert.alert('Error', 'Could not share profile'); }
  }, [chatProfile, resolvedChat]);

  const handleEditContact = useCallback(() => {
    const phone = chatProfile?.phone_number;
    if (!phone) { Alert.alert('No phone number', 'Cannot open contact editor.'); return; }
    Alert.alert('Edit contact', `Open Contacts to edit "${resolvedChat?.displayName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Contacts', onPress: () => Linking.openURL(`tel:${phone}`).catch(() => { }) },
    ]);
  }, [chatProfile, resolvedChat]);

  const handleAddContact = useCallback(() => {
    Alert.alert('Add to contacts', "Open your phone's Contacts app to save this number.");
  }, []);

  // ── Menu items ────────────────────────────────────────────────────────────────

  const menuItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [];
    if (!isGroup) {
      if (resolvedChat?.isSavedContact) {
        items.push({ id: 'edit', label: 'Edit contact', icon: 'create-outline', onPress: handleEditContact });
      } else {
        items.push({ id: 'add', label: 'Add to contacts', icon: 'person-add-outline', onPress: handleAddContact });
      }
    }
    items.push({ id: 'share', label: 'Share profile', icon: 'share-outline', onPress: handleShareProfile });
    return items;
  }, [isGroup, resolvedChat, handleEditContact, handleAddContact, handleShareProfile]);

  // Section renders

  const renderProfileHeader = () => {
    if (!chatProfile || !resolvedChat) return null;

    let subLine: string | null = null;
    if (isGroup) {
      subLine = chatProfile.members ? `${chatProfile.members.length} members` : null;
    } else if (resolvedChat.isSavedContact && chatProfile.name && chatProfile.name !== resolvedChat.displayName) {
      subLine = `~${chatProfile.name}`;
    } else if (!resolvedChat.isSavedContact && chatProfile.phone_number) {
      subLine = chatProfile.phone_number;
    }

    return (
      <View style={[s.profileHeader, { backgroundColor: C.cardBg }]}>
        {/* Avatar */}
        <TouchableOpacity
          onPress={isGroup && isAdmin ? handleChangeAvatar : undefined}
          activeOpacity={isGroup && isAdmin ? 0.8 : 1}
          style={[s.avatarWrapper, { borderColor: C.accent }]}
        >
          {chatProfile.avatar_url ? (
            <Image source={{ uri: chatProfile.avatar_url }} style={s.fill} />
          ) : (
            <View style={[s.avatarPlaceholder, { backgroundColor: C.inputBg }]}>
              <Ionicons name={isGroup ? 'people' : 'person'} size={48} color={C.sub} />
            </View>
          )}

          {/* Camera overlay — visible for group admins only */}
          {isGroup && isAdmin ? (
            <View style={s.avatarOverlay}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={18} color="#fff" />}
            </View>
          ) : null}
        </TouchableOpacity>

        {/* Name block */}
        <View style={s.nameBlock}>
          {isGroup && isAdmin ? (
            editingName ? (
              /* ── Editing state ── */
              <View style={s.nameEditRow}>
                <TextInput
                  ref={nameInputRef}
                  style={[s.nameInput, { color: C.text, borderColor: C.accent, backgroundColor: C.inputBg }]}
                  value={draftName}
                  onChangeText={setDraftName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                  maxLength={60}
                />
                {savingName ? (
                  <ActivityIndicator size="small" color={C.accent} style={{ marginLeft: 8 }} />
                ) : (
                  <View style={s.nameEditActions}>
                    <TouchableOpacity onPress={handleCancelName} style={s.nameActionBtn}>
                      <Ionicons name="close-circle" size={22} color={C.sub} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSaveName} style={s.nameActionBtn}>
                      <Ionicons name="checkmark-circle" size={22} color={C.accent} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              /* ── Tap-to-edit idle state ── */
              <TouchableOpacity
                style={s.nameEditRow}
                onPress={() => {
                  setEditingName(true);
                  setTimeout(() => nameInputRef.current?.focus(), 50);
                }}
                activeOpacity={0.7}
              >
                <Text style={[s.nameText, { color: C.text, flex: 1 }]} numberOfLines={2}>
                  {resolvedChat.displayName}
                </Text>
                <Ionicons name="pencil-outline" size={16} color={C.sub} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            )
          ) : (
            <Text style={[s.nameText, { color: C.text }]} numberOfLines={2}>
              {resolvedChat.displayName}
            </Text>
          )}

          {subLine ? <Text style={[s.subLineText, { color: C.sub }]}>{subLine}</Text> : null}
          {chatProfile.username && !isGroup ? (
            <Text style={[s.usernameText, { color: C.sub }]}>@{chatProfile.username}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  // ── About / Description ───────────────────────────────────────────────────────

  const renderAbout = () => {
    const label = isGroup ? 'Description' : 'About';
    const value = chatProfile?.about;
    const canEdit = isGroup && isAdmin;

    // For direct chat: always show (even if empty)
    // For group: always show (even if empty)
    return (
      <View style={[s.card, { backgroundColor: C.cardBg }]}>
        <View style={s.rowHeader}>
          <Ionicons name="information-circle-outline" size={20} color={C.accent} style={s.rowIcon} />
          <Text style={[s.sectionLabel, { color: C.sub }]}>{label}</Text>
          {canEdit ? (
            <TouchableOpacity
              onPress={() => { setDraftDesc(value ?? ''); setShowDescModal(true); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil-outline" size={16} color={C.sub} />
            </TouchableOpacity>
          ) : null}
        </View>
        {value ? (
          <Text style={[s.bodyText, { color: C.text }]}>{value}</Text>
        ) : (
          <Text style={[s.emptyText, { color: C.sub }]}>
            {canEdit ? 'No description — tap ✏ above to add one' : isGroup ? 'No group description' : 'No about'}
          </Text>
        )}
      </View>
    );
  };

  // ── Phone (direct only, not saved contacts) ───────────────────────────────────

  const renderPhone = () => {
    if (isGroup || !chatProfile?.phone_number || resolvedChat?.isSavedContact) return null;
    return (
      <View style={[s.card, { backgroundColor: C.cardBg }]}>
        <View style={s.rowHeader}>
          <Ionicons name="call-outline" size={20} color={C.accent} style={s.rowIcon} />
          <Text style={[s.sectionLabel, { color: C.sub }]}>Phone</Text>
        </View>
        <Text style={[s.bodyText, { color: C.text }]}>{chatProfile.phone_number}</Text>
      </View>
    );
  };

  // ── Links ─────────────────────────────────────────────────────────────────────

  const renderLinks = () => {
    const links = chatProfile?.profile_links ?? [];
    const canEdit = isGroup && isAdmin;

    // Always show for groups (admin can add); always show for direct chat if links exist.
    // Direct chat with no links: still show so the user can see the section exists.
    return (
      <View style={[s.card, { backgroundColor: C.cardBg }]}>
        <View style={s.rowHeader}>
          <Ionicons name="link-outline" size={20} color={C.accent} style={s.rowIcon} />
          <Text style={[s.sectionLabel, { color: C.sub }]}>Links</Text>
          {canEdit ? (
            <TouchableOpacity
              onPress={() => { setDraftLinkTitle(''); setDraftLinkUrl(''); setShowLinkModal(true); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add-circle-outline" size={20} color={C.accent} />
            </TouchableOpacity>
          ) : null}
        </View>

        {links.length > 0 ? (
          links.map((link, i) => (
            <TouchableOpacity
              key={`${link.url}-${i}`}
              style={[s.linkRow, { borderBottomColor: C.border }]}
              onPress={() => Linking.openURL(link.url).catch(() => { })}
              onLongPress={() => canEdit && handleRemoveLink(link)}
              activeOpacity={0.7}
            >
              <Ionicons name="link-outline" size={16} color={C.accent} style={{ marginRight: 0 }} />
              <View style={s.linkInfo}>
                <Text style={[s.linkTitle, { color: C.text }]}>{link.key}</Text>
                <Text style={[s.linkUrl, { color: C.sub }]} numberOfLines={1}>{link.url}</Text>
              </View>
              {canEdit ? (
                <TouchableOpacity
                  onPress={() => handleRemoveLink(link)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color={C.danger} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="open-outline" size={16} color={C.sub} />
              )}
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[s.emptyText, { color: C.sub }]}>
            {canEdit ? 'No links — tap + above to add one' : 'No links added'}
          </Text>
        )}
      </View>
    );
  };

  // ── Group members ─────────────────────────────────────────────────────────────

  const renderGroupMembers = () => {
    if (!isGroup || !chatProfile.members?.length) return null;

    return (
      <View style={[s.card, { backgroundColor: C.cardBg }]}>
        <View style={[s.rowHeader, { marginBottom: 4 }]}>
          <Ionicons name="people-outline" size={20} color={C.accent} style={s.rowIcon} />
          <Text style={[s.sectionLabel, { color: C.sub }]}>
            {chatProfile.members.length} members
          </Text>
          {isAdmin ? (
            <TouchableOpacity
              onPress={() => { setSelectedToAdd(new Set()); setShowAddMember(true); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="person-add-outline" size={20} color={C.accent} />
            </TouchableOpacity>
          ) : null}
        </View>

        {chatProfile.members.map((member) => (
          <MemberRow
            key={member.user_id}
            member={member}
            byProfileId={byProfileId}
            C={C}
            currentUserId={currentUserId || ""}
            isCurrentUserAdmin={isAdmin}
            adminCount={adminCount}
            onPress={handleMemberPress}
          />
        ))}
      </View>
    );
  };

  // Modals

  const renderDescModal = () => (
    <Modal
      visible={showDescModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDescModal(false)}
    >
      <KeyboardAvoidingView
        style={s.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[s.modalBox, { backgroundColor: C.cardBg }]}>
          <View style={s.modalHead}>
            <Text style={[s.modalTitle, { color: C.text }]}>Group description</Text>
            <TouchableOpacity onPress={() => setShowDescModal(false)}>
              <Ionicons name="close" size={24} color={C.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[s.modalTextArea, { backgroundColor: C.inputBg, color: C.text, borderColor: C.border }]}
            value={draftDesc}
            onChangeText={setDraftDesc}
            placeholder="Describe the group…"
            placeholderTextColor={C.placeholder}
            multiline
            numberOfLines={4}
            maxLength={500}
            autoFocus
          />
          <Text style={[s.charCount, { color: C.sub }]}>{draftDesc.length}/500</Text>

          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: C.accent, opacity: savingDesc ? 0.7 : 1 }]}
            onPress={handleSaveDesc}
            disabled={savingDesc}
          >
            {savingDesc
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderLinkModal = () => (
    <Modal
      visible={showLinkModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowLinkModal(false)}
    >
      <KeyboardAvoidingView
        style={s.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[s.modalBox, { backgroundColor: C.cardBg }]}>
          <View style={s.modalHead}>
            <Text style={[s.modalTitle, { color: C.text }]}>Add link</Text>
            <TouchableOpacity onPress={() => setShowLinkModal(false)}>
              <Ionicons name="close" size={24} color={C.text} />
            </TouchableOpacity>
          </View>

          <View style={s.modalField}>
            <Text style={[s.modalLabel, { color: C.sub }]}>Title</Text>
            <TextInput
              style={[s.modalInput, { backgroundColor: C.inputBg, color: C.text, borderColor: C.border }]}
              value={draftLinkTitle}
              onChangeText={setDraftLinkTitle}
              placeholder="e.g. GitHub, Portfolio"
              placeholderTextColor={C.placeholder}
            />
          </View>

          <View style={s.modalField}>
            <Text style={[s.modalLabel, { color: C.sub }]}>URL</Text>
            <TextInput
              style={[s.modalInput, { backgroundColor: C.inputBg, color: C.text, borderColor: C.border }]}
              value={draftLinkUrl}
              onChangeText={setDraftLinkUrl}
              placeholder="https://…"
              placeholderTextColor={C.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: C.accent, opacity: savingLink ? 0.7 : 1 }]}
            onPress={handleAddLink}
            disabled={savingLink}
          >
            {savingLink
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.saveBtnText}>Add link</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderAddMemberModal = () => (
    <Modal
      visible={showAddMember}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddMember(false)}
    >
      <View style={[s.modalOverlay, { justifyContent: 'flex-end' }]}>
        <View style={[s.addMemberSheet, { backgroundColor: C.cardBg }]}>
          <View style={[s.modalHead, { paddingHorizontal: 16, paddingTop: 16 }]}>
            <Text style={[s.modalTitle, { color: C.text }]}>Add members</Text>
            <TouchableOpacity onPress={() => setShowAddMember(false)}>
              <Ionicons name="close" size={24} color={C.text} />
            </TouchableOpacity>
          </View>

          <Text style={[s.selectionHint, { color: selectedToAdd.size > 0 ? C.accent : C.sub }]}>
            {selectedToAdd.size > 0 ? `${selectedToAdd.size} selected` : 'Select contacts to add'}
          </Text>

          {addableContacts.length === 0 ? (
            <View style={s.emptyAddContainer}>
              <Ionicons name="people-outline" size={40} color={C.sub} />
              <Text style={[s.emptyText, { color: C.sub, marginTop: 12, textAlign: 'center', fontStyle: 'normal' }]}>
                All your contacts are already in this group
              </Text>
            </View>
          ) : (
            <FlatList
              data={addableContacts}
              keyExtractor={(item) => item.contactId}
              style={s.addMemberList}
              renderItem={({ item }) => {
                const isSelected = item.profileId ? selectedToAdd.has(item.profileId) : false;
                return (
                  <TouchableOpacity
                    style={[s.addMemberRow, { borderBottomColor: C.border }]}
                    onPress={() => item.profileId && toggleSelectContact(item.profileId)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.memberAvatar, { backgroundColor: item.avatarColor ?? C.inputBg }]}>
                      <Text style={s.avatarInitial}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={s.memberInfo}>
                      <Text style={[s.memberName, { color: C.text }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[s.memberSub, { color: C.sub }]} numberOfLines={1}>{item.phone}</Text>
                    </View>
                    <View style={[
                      s.checkCircle, { marginLeft: 8 },
                      isSelected
                        ? { backgroundColor: C.accent, borderColor: C.accent }
                        : { borderColor: C.border },
                    ]}>
                      {isSelected ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {addableContacts.length > 0 ? (
            <TouchableOpacity
              style={[
                s.saveBtn,
                {
                  backgroundColor: selectedToAdd.size > 0 ? C.accent : C.border,
                  marginHorizontal: 16,
                  marginBottom: Platform.OS === 'ios' ? 32 : 16,
                  marginTop: 8,
                  opacity: addingMembers ? 0.7 : 1,
                },
              ]}
              onPress={handleConfirmAddMembers}
              disabled={selectedToAdd.size === 0 || addingMembers}
            >
              {addingMembers
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.saveBtnText}>
                  Add{selectedToAdd.size > 0 ? ` ${selectedToAdd.size}` : ''} member{selectedToAdd.size !== 1 ? 's' : ''}
                </Text>}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Loading guard
  // ─────────────────────────────────────────────────────────────────────────────

  if (!chatProfile) {
    return (
      <View style={[s.container, { backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  // Full render

  return (
    <KeyboardAvoidingView
      style={[s.container, { backgroundColor: C.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top bar */}
      <View style={[s.topBar, { backgroundColor: C.cardBg, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowMenu(true)} style={s.iconBtn}>
          <Ionicons name="ellipsis-vertical" size={24} color={C.text} />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollBody}>
        {renderProfileHeader()}
        {renderAbout()}
        {renderPhone()}
        {renderLinks()}
        {renderGroupMembers()}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      {renderDescModal()}
      {renderLinkModal()}
      {renderAddMemberModal()}

      {/* Context menu */}
      <ModalMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        menuItems={menuItems}
        menuWidth={200}
      />
    </KeyboardAvoidingView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },
  fill: { width: '100%', height: '100%' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  iconBtn: { padding: 8 },

  scrollBody: { paddingBottom: 24 },

  // Profile header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 8,
  },
  avatarWrapper: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 2, overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 26,
    backgroundColor: 'rgba(0,0,0,0.50)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameBlock: { flex: 1, marginLeft: 16 },
  nameText: { fontSize: 22, fontWeight: '600', marginBottom: 2 },
  subLineText: { fontSize: 13, marginBottom: 2 },
  usernameText: { fontSize: 13 },

  // Inline name editing
  nameEditRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  nameInput: { flex: 1, fontSize: 20, fontWeight: '600', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  nameEditActions: { flexDirection: 'row', marginLeft: 6 },
  nameActionBtn: { padding: 4 },

  // Admin quick-action bar
  adminBar: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  adminBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
  },
  adminBarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  adminBarBtn: {
    alignItems: 'center',
    minWidth: 52,
  },
  adminBarIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBarBtnLabel: {
    fontSize: 11,
    marginTop: 4,
  },

  // Generic card
  card: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
  },
  rowIcon: { marginRight: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '500', flex: 1 },
  bodyText: { fontSize: 16, paddingVertical: 4 },
  emptyText: { fontSize: 14, paddingVertical: 4, fontStyle: 'italic' },

  // Links
  linkRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  linkInfo: { flex: 1, marginLeft: 12 },
  linkTitle: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  linkUrl: { fontSize: 12 },

  // Members
  memberRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  memberAvatar: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    flexShrink: 0,
  },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 15, fontWeight: '500' },
  memberSub: { fontSize: 12, marginTop: 1 },
  adminBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  adminBadgeText: { fontSize: 11, fontWeight: '500' },
  avatarInitial: { color: '#fff', fontSize: 18, fontWeight: '600' },

  // Add member bottom sheet
  addMemberSheet: {
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  addMemberList: { flexGrow: 0 },
  addMemberRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  selectionHint: { fontSize: 13, paddingHorizontal: 16, marginBottom: 4 },
  emptyAddContainer: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBox: { width: '90%', maxHeight: '85%', borderRadius: 12, padding: 20 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalField: { marginBottom: 16 },
  modalLabel: { fontSize: 14, marginBottom: 8 },
  modalInput: { fontSize: 16, padding: 12, borderRadius: 8, borderWidth: 1 },
  modalTextArea: { fontSize: 16, padding: 12, borderRadius: 8, borderWidth: 1, minHeight: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 12, textAlign: 'right', marginBottom: 16 },
  saveBtn: { padding: 14, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default ChatProfileScreen;