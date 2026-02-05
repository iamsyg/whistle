// frontend/app/(screens)/classroomProfile.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import MessagingHeader from '@/components/MessagingHeader';
import { router, useLocalSearchParams } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { updateClassroomProfile } from '@/store/slices/classroom/classroomSlice';
import { useFetchEmailClassroomMembers } from '@/hooks/classroom/fetchMembers/useFetchEmailClassroomMembers';
import { useFetchNonEmailClassroomMembers } from '@/hooks/classroom/fetchMembers/userFetchNonEmailClassroomMembers';
import { clearMembers, setAllMembers } from '@/store/slices/classroom/classroomMembersCard';
import { classroomMembersCardTypes } from '@/types/classroom/classroomMembersCardTypes';

interface ClassroomProfileProps {
  classroomId: string;
  onBackPress?: () => void;
  isDarkMode?: boolean;
}

const ClassroomProfile: React.FC<ClassroomProfileProps> = ({ classroomId, onBackPress, isDarkMode }) => {
  // State for classroom data
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const { chat_id } = useLocalSearchParams<{ chat_id: string }>();

  const classroom = useSelector(
    (state: RootState) => chat_id ? state.classroom.classrooms[chat_id] : undefined
  )

  const admins = useSelector(
    (state: RootState) => state.classroomMembersCard.members ? Object.values(state.classroomMembersCard.members).filter(m => m.role === 'admin') : []
  )

  const members = useSelector(
    (state: RootState) => state.classroomMembersCard.members ? Object.values(state.classroomMembersCard.members).filter(m => m.role === 'member') : []
  )

  const { fetchClassroomMembers: fetchEmailClassroomMembers, loading: loadingEmailClassroomMembers, error: errorEmailClassroomMembers } = useFetchEmailClassroomMembers(chat_id);

  const { fetchClassroomMembers: fetchNonEmailClassroomMembers, loading: loadingNonEmailClassroomMembers, error: errorNonEmailClassroomMembers } = useFetchNonEmailClassroomMembers(chat_id);

  // const membersTitle = () => {
  //   if (classroom?.join_method === 'email') {
  //     setEmail(members.map(m => m.email).filter(e => e).join(', '));
  //     setGoogleName(members.map(m => m.google_name).filter(n => n).join(', '));
  //   }
  //   else if (classroom?.join_method === 'non-email') {
  //     if (members.phone && members.phone.length > 0) {
  //       setNumber(members.map(m => m.phone).filter(p => p).join(', '));
  //     }
  //     else if (members.username && members.username.length > 0) {
  //       setName(members.map(m => m.username).filter(u => u).join(', '));
  //     }
  //   }
  // }

  const fetchMembers = async () => {

    setLoading(true);
    let members = [];

    if (classroom?.join_method === 'email') {

      try {
        members = await fetchEmailClassroomMembers();
      }
      catch (err) {
        Alert.alert('Error', 'Failed to fetch classroom members. Please try again later.');
        console.error('Error fetching email classroom members:', err);
      }
    }
    else if (classroom?.join_method === 'non-email') {
      try {
        members = await fetchNonEmailClassroomMembers();
      }
      catch (err) {
        Alert.alert('Error', 'Failed to fetch classroom members. Please try again later.');
        console.error('Error fetching non-email classroom members:', err);
      }
    }

    console.log('Fetched members:', members);
    dispatch(clearMembers());
    dispatch(setAllMembers(members));
    // membersTitle();
    setLoading(false);
  }

  useEffect(() => {
    console.log('Classroom data:', classroom);

    if (classroom) {
      fetchMembers();
    }

    console.log('Admins:', admins); 
    console.log('Members:', members);

  }, [classroom]);

  // State for UI
  const [newInvites, setNewInvites] = useState<string>('');
  const [newDomain, setNewDomain] = useState<string>('');
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showDomainsModal, setShowDomainsModal] = useState<boolean>(false);
  const [inviteMode, setInviteMode] = useState<'email' | 'phone' | 'username'>('phone');

  // Handle profile picture change
  // const handleChangeProfilePicture = async () => {
  //   const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

  //   if (!permissionResult.granted) {
  //     Alert.alert('Permission Required', 'Permission to access camera roll is required!');
  //     return;
  //   }

  //   const pickerResult = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     allowsEditing: true,
  //     aspect: [1, 1],
  //     quality: 1,
  //   });

  //   if (!pickerResult.canceled && pickerResult.assets[0]) {
  //     // setClassroom(prev => ({
  //     //   ...prev,
  //     //   profilePicture: pickerResult.assets[0].uri,
  //     // }));

  //     dispatch(updateClassroomProfile({
  //       chat_id,
  //       changes: {
  //         allow_student_chat: !classroom?.allow_student_chat
  //       }
  //     }));
  //   }
  // };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', 'Text copied to clipboard');
  };

  // Toggle allow chat
  const toggleAllowChat = () => {

    dispatch(updateClassroomProfile({
      chat_id,
      changes: {
        allow_student_chat: !classroom?.allow_student_chat
      }
    }));
  };

  // Add new domain
  const addDomain = () => {
    if (newDomain.trim() && !classroom?.allowed_domains?.includes(newDomain.trim())) {

      dispatch(updateClassroomProfile({
        chat_id,
        changes: {
          allowed_domains: [...(classroom?.allowed_domains || []), newDomain.trim()],
        }
      }));

      setNewDomain('');
    }
  };

  // Remove domain
  const removeDomain = (domain: string) => {

    dispatch(updateClassroomProfile({
      chat_id,
      changes: {

        allowed_domains: classroom?.allowed_domains?.filter(d => d !== domain) || [],
      }
    }));
  };

  // Validate email domain
  const isValidEmailDomain = (email: string): boolean => {
    if (!classroom?.join_method || !classroom?.allowed_domains || classroom.allowed_domains.length === 0) {
      return true;
    }

    return classroom?.allowed_domains.some(domain => email.endsWith(`@${domain}`));
  };

  // Process invitations
  const processInvitations = () => {
    if (!newInvites.trim()) {
      Alert.alert('Error', 'Please enter email addresses or phone numbers');
      return;
    }

    const invites = newInvites
      .split(/[\n,;]+/)
      .map(invite => invite.trim())
      .filter(invite => invite.length > 0);

    const validInvites: string[] = [];
    const invalidInvites: string[] = [];

    if (classroom?.join_method === 'email') {
      // Email validation
      invites.forEach(invite => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(invite) && isValidEmailDomain(invite)) {
          validInvites.push(invite);
        } else {
          invalidInvites.push(invite);
        }
      });
    } else {
      // Phone or username validation
      invites.forEach(invite => {
        if (inviteMode === 'phone') {
          // Simplified phone validation
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (phoneRegex.test(invite.replace(/\D/g, ''))) {
            validInvites.push(invite);
          } else {
            invalidInvites.push(invite);
          }
        } else if (inviteMode === 'username') {
          // Username validation
          if (invite.length >= 3 && /^[a-zA-Z0-9_.-]+$/.test(invite)) {
            validInvites.push(invite);
          } else {
            invalidInvites.push(invite);
          }
        }
      });
    }

    if (invalidInvites.length > 0) {
      Alert.alert(
        'Invalid Entries',
        `${invalidInvites.length} entries are invalid:\n${invalidInvites.join('\n')}`
      );
    }

    if (validInvites.length > 0) {
      // Add new members (in a real app, this would be an API call)
      const newMembers: classroomMembersCardTypes[] = validInvites.map((invite, index) => {
        const baseMember = {
          user_id: `new-${Date.now()}-${index}`,
          name: invite.split('@')[0] || invite,
          role: 'member' as const, // Explicitly type as 'member'
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(invite.split('@')[0] || invite)}&background=4A90E2&color=fff`,
        };

        if (classroom?.join_method === 'email') {
          return {
            ...baseMember,
            email: invite
          } as classroomMembersCardTypes;
        } else {
          if (inviteMode === 'phone') {
            return {
              ...baseMember,
              phone: invite
            } as classroomMembersCardTypes;
          } else {
            return {
              ...baseMember,
              username: invite
            } as classroomMembersCardTypes;
          }
        }
      });

      dispatch(setAllMembers([...members, ...newMembers]));
      setNewInvites('');
      setShowInviteModal(false);

      Alert.alert('Success', `${validInvites.length} members invited successfully!`);
    }
  };

  const renderMemberItem = ({ item }: { item: classroomMembersCardTypes }) => {
  const avatarUri =
    item.google_avatar ||
    (item.google_name || item.email
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
          item.google_name || item.email || 'U'
        )}`
      : null);

  return (
    <View style={styles.memberCard}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.memberAvatar} />
      ) : (
        <View style={styles.classroomAvatar}>
          <Text style={styles.avatarText}>
            {(item.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {classroom?.join_method === 'email'
            ? item.google_name || item.email || 'Unknown'
            : item.name || 'Unknown'}
        </Text>
      </View>
    </View>
  );
};

  // Get invite placeholder based on mode
  const getInvitePlaceholder = () => {
    if (classroom?.join_method === 'email') {
      return 'john@university.edu, jane@college.edu\nOr paste from Excel/CSV file';
    } else {
      return inviteMode === 'phone'
        ? '+1234567890, +9876543210'
        : 'john_doe, jane_smith';
    }
  };

  // Get invite description
  const getInviteDescription = () => {
    if (classroom?.join_method === 'email') {
      return 'Enter email addresses (separated by commas, semicolons, or newlines). You can also paste from Excel/CSV files.';
    } else {
      return `Enter ${inviteMode}s (separated by commas, semicolons, or newlines)`;
    }
  };

  return (
    <View style={[
      styles.container,
      isDarkMode && styles.darkContainer
    ]}>

      {/* Header with MessagingHeader component */}
      <MessagingHeader
        title={''}
        subtitle={``}
        showBackButton={true}
        onBackPress={onBackPress}
        showSearch={false}
        showCall={false}
        showMenu={true}
        onMenuPress={() => Alert.alert('Menu', 'Additional options')}
        isDarkMode={isDarkMode}
        onPress={() => console.log('Header pressed')}
      />

      <ScrollView style={styles.scrollView}>
        {/* Classroom Header with Profile Picture */}
        <View style={[
          styles.header,
          isDarkMode && styles.darkHeader
        ]}>
          {/* <TouchableOpacity onPress={handleChangeProfilePicture}>
            <Image source={{ uri: classroom?.profile_picture }} style={styles.profileImage} />
            <View style={styles.editImageOverlay}>
              <MaterialIcons name="edit" size={20} color="#fff" />
            </View>
          </TouchableOpacity> */}

          <View style={styles.headerInfo}>
            <Text style={[
              styles.title,
              isDarkMode && styles.darkText
            ]}>{classroom?.title}</Text>
            <View style={styles.classroomCodeContainer}>
            </View>
          </View>
        </View>


        {/* Classroom Description */}
        <View style={[
          styles.section,
          isDarkMode && styles.darkSection
        ]}>
          <Text style={[
            styles.sectionTitle,
            isDarkMode && styles.darkText
          ]}>Description</Text>
          <Text style={[
            styles.description,
            isDarkMode && styles.darkSubtext
          ]}>{classroom?.description || '4o4'}</Text>
        </View>

        {/* Invite Link & Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invitation</Text>

          <TouchableOpacity
            style={styles.inviteCard}
            onPress={() => copyToClipboard(classroom?.invite_link || '')}
          >
            <MaterialIcons name="link" size={20} color="#4A90E2" />
            <View style={styles.inviteInfo}>
              <Text style={styles.inviteLabel}>Invite Link</Text>
              <Text style={styles.inviteValue} numberOfLines={1}>
                {classroom?.invite_link}
              </Text>
            </View>
            <MaterialIcons name="content-copy" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.inviteCard}
            onPress={() => copyToClipboard(classroom?.class_code || '')}
          >
            <MaterialIcons name="code" size={20} color="#4A90E2" />
            <View style={styles.inviteInfo}>
              <Text style={styles.inviteLabel}>Classroom Code</Text>
              <Text style={styles.inviteValue}>{classroom?.class_code}</Text>
            </View>
            <MaterialIcons name="content-copy" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={[
          styles.section,
          isDarkMode && styles.darkSection
        ]}>
          <Text style={[
            styles.sectionTitle,
            isDarkMode && styles.darkText
          ]}>Settings</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[
                styles.settingLabel,
                isDarkMode && styles.darkText
              ]}>Allow Chat</Text>
              <Text style={[
                styles.settingDescription,
                isDarkMode && styles.darkSubtext
              ]}>
                Members can chat with each other
              </Text>
            </View>
            <Switch
              value={classroom?.allow_student_chat}
              onValueChange={toggleAllowChat}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={classroom?.allow_student_chat ? '#4A90E2' : '#f4f3f4'}
            />
          </View>

          {/* Show allowed domains only if joinMethod is 'email' */}
          {classroom?.join_method === 'email' && (
            <TouchableOpacity
              style={[
                styles.domainButton,
                isDarkMode && styles.darkDomainButton
              ]}
              onPress={() => setShowDomainsModal(true)}
            >
              <MaterialIcons name="domain" size={20} color="#4A90E2" />
              <View style={styles.domainButtonInfo}>
                <Text style={[
                  styles.domainButtonText,
                  isDarkMode && styles.darkText
                ]}>
                  Allowed Email Domains
                </Text>
                {/* <Text style={[
                  styles.domainButtonSubtext,
                  isDarkMode && styles.darkSubtext
                ]}>
                  {classroom.allowedDomains.length > 0
                    ? `${classroom.allowedDomains.length} domains configured`
                    : 'No restrictions (any email allowed)'
                  }
                </Text> */}
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>
          )}

          {/* Join method info (non-editable, from backend) */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[
                styles.settingLabel,
                isDarkMode && styles.darkText
              ]}>Join Method</Text>
              <Text style={[
                styles.settingDescription,
                isDarkMode && styles.darkSubtext
              ]}>
                {classroom?.join_method === 'email'
                  ? 'Members must join with email address'
                  : 'Members can join with phone number or username'
                }
              </Text>
            </View>
            <MaterialIcons
              name={classroom?.join_method === 'email' ? "email" : "smartphone"}
              size={24}
              color="#4A90E2"
            />
          </View>
        </View>

        {/* Invite Members Button */}
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => setShowInviteModal(true)}
        >
          <Ionicons name="person-add" size={24} color="#fff" />
          <Text style={styles.inviteButtonText}>Invite Members</Text>
        </TouchableOpacity>

        {/* Admins Section */}
        <View style={[
          styles.section,
          isDarkMode && styles.darkSection
        ]}>
          <Text style={[
            styles.sectionTitle,
            isDarkMode && styles.darkText
          ]}>Admins ({admins.length})</Text>
          <FlatList
            data={admins}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.user_id}
            scrollEnabled={false}
          />
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.user_id}
            scrollEnabled={false}
          />
        </View>

        {/* Modals */}
        {/* Allowed Domains Modal */}
        <Modal
          visible={showDomainsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDomainsModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Allowed Email Domains</Text>
                <TouchableOpacity onPress={() => setShowDomainsModal(false)}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                Members can only join using email addresses from these domains
              </Text>

              <View style={styles.domainInputContainer}>
                <TextInput
                  style={styles.domainInput}
                  placeholder="Add domain (e.g., university.edu)"
                  value={newDomain}
                  onChangeText={setNewDomain}
                  onSubmitEditing={addDomain}
                />
                <TouchableOpacity style={styles.addButton} onPress={addDomain}>
                  <MaterialIcons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={classroom?.allowed_domains}
                renderItem={({ item }) => (
                  <View style={styles.domainItem}>
                    <Text style={styles.domainText}>{item}</Text>
                    <TouchableOpacity onPress={() => removeDomain(item)}>
                      <MaterialIcons name="remove-circle" size={24} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                )}
                keyExtractor={(item) => item}
                style={styles.domainList}
              />

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDomainsModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Invite Members Modal */}
        <Modal
          visible={showInviteModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowInviteModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Invite Members</Text>
                  <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                    <MaterialIcons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalScrollView}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {!classroom?.require_email && (
                    <View style={styles.inviteModeSelector}>
                      <TouchableOpacity
                        style={[
                          styles.modeButton,
                          inviteMode === 'phone' && styles.modeButtonActive
                        ]}
                        onPress={() => setInviteMode('phone')}
                      >
                        <Text style={[
                          styles.modeButtonText,
                          inviteMode === 'phone' && styles.modeButtonTextActive
                        ]}>Phone</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modeButton,
                          inviteMode === 'username' && styles.modeButtonActive
                        ]}
                        onPress={() => setInviteMode('username')}
                      >
                        <Text style={[
                          styles.modeButtonText,
                          inviteMode === 'username' && styles.modeButtonTextActive
                        ]}>Username</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <Text style={styles.modalDescription}>
                    {getInviteDescription()}
                  </Text>

                  {classroom?.require_email && (classroom?.allowed_domains?.length ?? 0) > 0 && (
                    <View style={styles.domainRestrictionsNote}>
                      <MaterialIcons name="info" size={16} color="#4A90E2" />
                      <Text style={styles.allowedDomainsNote}>
                        Allowed domains: {classroom?.allowed_domains?.join(', ')}
                      </Text>
                    </View>
                  )}

                  <TextInput
                    style={styles.inviteInput}
                    placeholder={getInvitePlaceholder()}
                    value={newInvites}
                    onChangeText={setNewInvites}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    returnKeyType="done"
                  />
                </ScrollView>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.pasteButton]}
                    onPress={async () => {
                      const text = await Clipboard.getStringAsync();
                      if (text) {
                        setNewInvites(text);
                        Alert.alert('Success', 'Text pasted successfully!');
                      }
                    }}
                  >
                    <MaterialIcons name="content-paste" size={20} color="#4A90E2" />
                    <Text style={styles.pasteButtonText}>Paste</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowInviteModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.sendButton]}
                    onPress={processInvitations}
                  >
                    <Text style={styles.sendButtonText}>
                      {classroom?.require_email ? 'Send Email Invites' : 'Send Invites'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#1F2C34',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  darkHeader: {
    backgroundColor: '#1F2C34',
    borderBottomColor: '#2A3942',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  editImageOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#4A90E2',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  darkText: {
    color: '#fff',
  },
  classroomCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  classroomCode: {
    fontSize: 16,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginRight: 10,
  },
  requireEmailBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  emailBadge: {
    backgroundColor: '#e3f2fd',
  },
  phoneUsernameBadge: {
    backgroundColor: '#f3e5f5',
  },
  requireEmailBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  darkSubtext: {
    color: '#A0A0A0',
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkSection: {
    backgroundColor: '#2A3942',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  darkInviteCard: {
    backgroundColor: '#2A3942',
    borderColor: '#37474F',
  },
  inviteInfo: {
    flex: 1,
    marginLeft: 12,
  },
  inviteLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  inviteValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  domainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  darkDomainButton: {
    borderTopColor: '#37474F',
  },
  domainButtonInfo: {
    flex: 1,
    marginLeft: 10,
  },
  domainButtonText: {
    fontSize: 14,
    color: '#333',
  },
  domainButtonSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    marginHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 8,
    marginVertical: 16,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkMemberCard: {
    borderBottomColor: '#37474F',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  memberDetail: {
    fontSize: 12,
    color: '#666',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadge: {
    backgroundColor: '#ffebee',
  },
  memberBadge: {
    backgroundColor: '#e8f5e9',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  domainInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  domainInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
  },
  darkInput: {
    borderColor: '#37474F',
    backgroundColor: '#2A3942',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#4A90E2',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  domainList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  domainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkDomainItem: {
    borderBottomColor: '#37474F',
  },
  domainText: {
    fontSize: 14,
    color: '#333',
  },
  emptyDomainsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    marginBottom: 20,
  },
  emptyDomainsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    fontWeight: '500',
  },
  emptyDomainsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  modalCloseButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inviteModeSelector: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#4A90E2',
  },
  domainRestrictionsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  allowedDomainsNote: {
    fontSize: 12,
    color: '#1565c0',
    fontStyle: 'italic',
    marginLeft: 5,
    flex: 1,
  },
  inviteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 20,
    minHeight: 120,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pasteButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  pasteButtonText: {
    marginLeft: 5,
    color: '#4A90E2',
    fontWeight: '500',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  sendButton: {
    flex: 2,
    backgroundColor: '#4A90E2',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlay: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  darkModalContent: {
    backgroundColor: '#1F2C34',
  },
  modalScrollView: {
    maxHeight: '70%',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  classroomAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6f42c1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default ClassroomProfile;