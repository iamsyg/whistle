// frontend/app/(screens)/classroomProfile.tsx

import React, { useState } from 'react';
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
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import MessagingHeader from '@/components/MessagingHeader';

// Types
interface ClassroomMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  username?: string;
  role: 'admin' | 'member';
  avatar?: string;
}

interface ClassroomProfileProps {
  classroomId: string;
  onBackPress?: () => void;
  isDarkMode?: boolean;
}

// Custom clipboard utility
const clipboardUtils = {
  async copy(text: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(text);
        Alert.alert('Copied!', 'Text copied to clipboard');
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          Alert.alert('Copied!', 'Text copied to clipboard');
        } catch (err) {
          Alert.alert('Error', 'Failed to copy to clipboard');
        }
        document.body.removeChild(textArea);
      }
    } else {
      // For React Native, we'll show text to copy
      Alert.alert(
        'Copy to Clipboard',
        `Copy this text:\n\n${text}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Copy',
            onPress: () => {
              // In a real app, you might want to use @react-native-clipboard/clipboard here
              Alert.alert('Copied!', 'Text copied to clipboard');
            }
          }
        ]
      );
    }
  },

  async paste(): Promise<string> {
    if (Platform.OS === 'web') {
      try {
        return await navigator.clipboard.readText();
      } catch (error) {
        // Fallback for older browsers or denied permissions
        Alert.alert('Error', 'Unable to access clipboard. Please paste manually.');
        return '';
      }
    } else {
      // For React Native, show input prompt
      Alert.prompt(
        'Paste Text',
        'Please paste your text:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'OK',
            onPress: (text: any) => {
              if (text) {
                Alert.alert('Text Pasted', 'Text has been pasted into the field.');
                return text;
              }
              return '';
            }
          }
        ],
        'plain-text'
      );
      return '';
    }
  }
};

const ClassroomProfile: React.FC<ClassroomProfileProps> = ({
  classroomId,
  onBackPress,
  isDarkMode = false
}) => {
  // State for classroom data - simulate data from backend
  const [classroom, setClassroom] = useState({
    id: classroomId,
    title: 'Advanced Mathematics 101',
    description: 'This classroom covers advanced topics in calculus, linear algebra, and differential equations. All assignments and resources will be posted here.',
    profilePicture: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=400&fit=crop',
    code: 'MATH2024',
    inviteLink: 'https://classroom.example.com/join/MATH2024',
    allowChat: true,

    // This would come from backend
    requireEmail: true, // true = email only, false = phone/username
    allowedDomains: ['edu.in', 'university.edu', 'college.edu'], // Optional, only if requireEmail is true
  });

  // State for members
  const [admins, setAdmins] = useState<ClassroomMember[]>([
    { id: '1', name: 'Dr. Sarah Johnson', email: 'sarah@university.edu', role: 'admin', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop' },
    { id: '2', name: 'Prof. Michael Chen', email: 'michael@college.edu', role: 'admin', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
  ]);

  const [members, setMembers] = useState<ClassroomMember[]>([
    { id: '3', name: 'Alice Smith', email: 'alice@edu.in', role: 'member', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
    { id: '4', name: 'Bob Wilson', email: 'bob@university.edu', role: 'member', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
    { id: '5', name: 'Charlie Brown', email: 'charlie@college.edu', role: 'member', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
    { id: '6', name: 'Diana Prince', email: 'diana@edu.in', role: 'member', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
    { id: '7', name: 'Ethan Hunt', email: 'ethan@university.edu', role: 'member', avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=100&h=100&fit=crop' },
  ]);

  // State for UI
  const [newInvites, setNewInvites] = useState<string>('');
  const [newDomain, setNewDomain] = useState<string>('');
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showDomainsModal, setShowDomainsModal] = useState<boolean>(false);
  const [inviteMode, setInviteMode] = useState<'phone' | 'username'>('phone'); // Only for non-email mode

  // Handle profile picture change
  const handleChangeProfilePicture = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setClassroom(prev => ({
        ...prev,
        profilePicture: pickerResult.assets[0].uri,
      }));
    }
  };

  // Toggle allow chat
  const toggleAllowChat = () => {
    setClassroom(prev => ({ ...prev, allowChat: !prev.allowChat }));
  };

  // Add new domain
  const addDomain = () => {
    if (newDomain.trim() && !classroom.allowedDomains.includes(newDomain.trim())) {
      setClassroom(prev => ({
        ...prev,
        allowedDomains: [...prev.allowedDomains, newDomain.trim()],
      }));
      setNewDomain('');
    }
  };

  // Remove domain
  const removeDomain = (domain: string) => {
    setClassroom(prev => ({
      ...prev,
      allowedDomains: prev.allowedDomains.filter(d => d !== domain),
    }));
  };

  // Validate email domain
  const isValidEmailDomain = (email: string): boolean => {
    if (!classroom.requireEmail || classroom.allowedDomains.length === 0) {
      return true;
    }

    return classroom.allowedDomains.some(domain => email.endsWith(`@${domain}`));
  };

  // Process invitations based on requireEmail flag
  // Process invitations based on requireEmail flag
  const processInvitations = () => {
    if (!newInvites.trim()) {
      Alert.alert('Error', `Please enter ${classroom.requireEmail ? 'email addresses' : `${inviteMode}s`}`);
      return;
    }

    const invites = newInvites
      .split(/[\n,;]+/)
      .map(invite => invite.trim())
      .filter(invite => invite.length > 0);

    const validInvites: string[] = [];
    const invalidInvites: string[] = [];

    if (classroom.requireEmail) {
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
      const newMembers: ClassroomMember[] = validInvites.map((invite, index) => {
        const baseMember = {
          id: `new-${Date.now()}-${index}`,
          name: invite.split('@')[0] || invite,
          role: 'member' as const, // Explicitly type as 'member'
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(invite.split('@')[0] || invite)}&background=4A90E2&color=fff`,
        };

        if (classroom.requireEmail) {
          return {
            ...baseMember,
            email: invite
          } as ClassroomMember;
        } else {
          if (inviteMode === 'phone') {
            return {
              ...baseMember,
              phone: invite
            } as ClassroomMember;
          } else {
            return {
              ...baseMember,
              username: invite
            } as ClassroomMember;
          }
        }
      });

      setMembers(prev => [...prev, ...newMembers]);
      setNewInvites('');
      setShowInviteModal(false);

      Alert.alert('Success', `${validInvites.length} members invited successfully!`);
    }
  };

  // Handle paste from clipboard
  const handlePaste = async () => {
    Alert.prompt(
      'Paste Text',
      'Paste your text below:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: (text: any) => {
            if (text) {
              setNewInvites(text);
              Alert.alert('Success', 'Text pasted successfully!');
            }
          }
        }
      ],
      'plain-text',
      newInvites
    );
  };

  // Render member item
  const renderMemberItem = ({ item }: { item: ClassroomMember }) => (
    <View style={[
      styles.memberCard,
      isDarkMode && styles.darkMemberCard
    ]}>
      <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
      <View style={styles.memberInfo}>
        <Text style={[
          styles.memberName,
          isDarkMode && styles.darkText
        ]}>{item.name}</Text>
        <Text style={[
          styles.memberDetail,
          isDarkMode && styles.darkSubtext
        ]}>
          {item.email || item.phone || item.username || 'No contact info'}
        </Text>
      </View>
      <View style={[
        styles.roleBadge,
        item.role === 'admin' ? styles.adminBadge : styles.memberBadge
      ]}>
        <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
      </View>
    </View>
  );

  // Get invite placeholder based on mode
  const getInvitePlaceholder = () => {
    if (classroom.requireEmail) {
      return 'john@university.edu, jane@college.edu\nOr paste from Excel/CSV file';
    } else {
      return inviteMode === 'phone'
        ? '+1234567890, +9876543210'
        : 'john_doe, jane_smith';
    }
  };

  // Get invite description
  const getInviteDescription = () => {
    if (classroom.requireEmail) {
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
          <TouchableOpacity onPress={handleChangeProfilePicture}>
            <Image source={{ uri: classroom.profilePicture }} style={styles.profileImage} />
            <View style={styles.editImageOverlay}>
              <MaterialIcons name="edit" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={[
              styles.title,
              isDarkMode && styles.darkText
            ]}>{classroom.title}</Text>
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
          ]}>{classroom.description}</Text>
        </View>

        {/* Invite Link & Code */}
        <View style={[
          styles.section,
          isDarkMode && styles.darkSection
        ]}>
          <Text style={[
            styles.sectionTitle,
            isDarkMode && styles.darkText
          ]}>Invitation</Text>

          <TouchableOpacity
            style={[
              styles.inviteCard,
              isDarkMode && styles.darkInviteCard
            ]}
            onPress={() => clipboardUtils.copy(classroom.inviteLink)}
          >
            <MaterialIcons name="link" size={20} color="#4A90E2" />
            <View style={styles.inviteInfo}>
              <Text style={[
                styles.inviteLabel,
                isDarkMode && styles.darkSubtext
              ]}>Invite Link</Text>
              <Text style={[
                styles.inviteValue,
                isDarkMode && styles.darkText
              ]} numberOfLines={1}>
                {classroom.inviteLink}
              </Text>
            </View>
            <MaterialIcons name="content-copy" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.inviteCard,
              isDarkMode && styles.darkInviteCard
            ]}
            onPress={() => clipboardUtils.copy(classroom.code)}
          >
            <MaterialIcons name="code" size={20} color="#4A90E2" />
            <View style={styles.inviteInfo}>
              <Text style={[
                styles.inviteLabel,
                isDarkMode && styles.darkSubtext
              ]}>Classroom Code</Text>
              <Text style={[
                styles.inviteValue,
                isDarkMode && styles.darkText
              ]}>{classroom.code}</Text>
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
              value={classroom.allowChat}
              onValueChange={toggleAllowChat}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={classroom.allowChat ? '#4A90E2' : '#f4f3f4'}
            />
          </View>

          {/* Show allowed domains only if requireEmail is true */}
          {classroom.requireEmail && (
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
                <Text style={[
                  styles.domainButtonSubtext,
                  isDarkMode && styles.darkSubtext
                ]}>
                  {classroom.allowedDomains.length > 0
                    ? `${classroom.allowedDomains.length} domains configured`
                    : 'No restrictions (any email allowed)'
                  }
                </Text>
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
                {classroom.requireEmail
                  ? 'Members must join with email address'
                  : 'Members can join with phone number or username'
                }
              </Text>
            </View>
            <MaterialIcons
              name={classroom.requireEmail ? "email" : "smartphone"}
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
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Members Section */}
        <View style={[
          styles.section,
          isDarkMode && styles.darkSection
        ]}>
          <Text style={[
            styles.sectionTitle,
            isDarkMode && styles.darkText
          ]}>Members ({members.length})</Text>
          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Modals */}
        {/* Allowed Domains Modal (only shown if requireEmail is true) */}
        <Modal
          visible={showDomainsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDomainsModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowDomainsModal(false)}
              />
              <View style={[
                styles.modalContent,
                isDarkMode && styles.darkModalContent
              ]}>
                <View style={styles.modalHeader}>
                  <Text style={[
                    styles.modalTitle,
                    isDarkMode && styles.darkText
                  ]}>Allowed Email Domains</Text>
                  <TouchableOpacity onPress={() => setShowDomainsModal(false)}>
                    <MaterialIcons name="close" size={24} color={isDarkMode ? "#fff" : "#333"} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalScrollView}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={[
                    styles.modalDescription,
                    isDarkMode && styles.darkSubtext
                  ]}>
                    {classroom.allowedDomains.length === 0
                      ? 'Currently no domain restrictions. Members can join with any email address.'
                      : 'Members can only join using email addresses from these domains. Leave empty to allow any email.'
                    }
                  </Text>

                  <View style={styles.domainInputContainer}>
                    <TextInput
                      style={[
                        styles.domainInput,
                        isDarkMode && styles.darkInput
                      ]}
                      placeholder="Add domain (e.g., university.edu)"
                      placeholderTextColor={isDarkMode ? "#888" : "#999"}
                      value={newDomain}
                      onChangeText={setNewDomain}
                      onSubmitEditing={addDomain}
                      returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.addButton} onPress={addDomain}>
                      <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {classroom.allowedDomains.length > 0 ? (
                    <FlatList
                      data={classroom.allowedDomains}
                      renderItem={({ item }) => (
                        <View style={[
                          styles.domainItem,
                          isDarkMode && styles.darkDomainItem
                        ]}>
                          <Text style={[
                            styles.domainText,
                            isDarkMode && styles.darkText
                          ]}>{item}</Text>
                          <TouchableOpacity onPress={() => removeDomain(item)}>
                            <Ionicons name="remove-circle" size={24} color="#ff4444" />
                          </TouchableOpacity>
                        </View>
                      )}
                      keyExtractor={(item) => item}
                      scrollEnabled={false}
                    />
                  ) : (
                    <View style={styles.emptyDomainsContainer}>
                      <MaterialIcons name="domain-disabled" size={48} color="#ccc" />
                      <Text style={[
                        styles.emptyDomainsText,
                        isDarkMode && styles.darkSubtext
                      ]}>
                        No domain restrictions
                      </Text>
                      <Text style={[
                        styles.emptyDomainsSubtext,
                        isDarkMode && styles.darkSubtext
                      ]}>
                        Members can join with any email address
                      </Text>
                    </View>
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowDomainsModal(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
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
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowInviteModal(false)}
              />
              <View style={[
                styles.modalContent,
                isDarkMode && styles.darkModalContent
              ]}>
                <View style={styles.modalHeader}>
                  <Text style={[
                    styles.modalTitle,
                    isDarkMode && styles.darkText
                  ]}>
                    {classroom.requireEmail ? 'Invite by Email' : 'Invite Members'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                    <MaterialIcons name="close" size={24} color={isDarkMode ? "#fff" : "#333"} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalScrollView}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Only show mode selector if requireEmail is false */}
                  {!classroom.requireEmail && (
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

                  <Text style={[
                    styles.modalDescription,
                    isDarkMode && styles.darkSubtext
                  ]}>
                    {getInviteDescription()}
                  </Text>

                  {/* Show domain restrictions note if requireEmail is true and domains are configured */}
                  {classroom.requireEmail && classroom.allowedDomains.length > 0 && (
                    <View style={styles.domainRestrictionsNote}>
                      <MaterialIcons name="info" size={16} color="#4A90E2" />
                      <Text style={styles.allowedDomainsNote}>
                        Allowed domains: {classroom.allowedDomains.join(', ')}
                      </Text>
                    </View>
                  )}

                  <TextInput
                    style={[
                      styles.inviteInput,
                      isDarkMode && styles.darkInput
                    ]}
                    placeholder={getInvitePlaceholder()}
                    placeholderTextColor={isDarkMode ? "#888" : "#999"}
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
                    onPress={handlePaste}
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
                      {classroom.requireEmail ? 'Send Email Invites' : 'Send Invites'}
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
});

export default ClassroomProfile;