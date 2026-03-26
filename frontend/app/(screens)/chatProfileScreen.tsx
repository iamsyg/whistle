// frontend/app/(screens)/chatProfileScreen.tsx

import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useFetchUserProfile } from '@/hooks/profile/useFetchUserProfile';
import { router } from 'expo-router';
import ModalMenu, { MenuItem } from '@/components/ModalMenu';

interface ChatProfileScreenProps {
  isDarkMode?: boolean;
  onClose?: () => void;
}

const ChatProfileScreen: React.FC<ChatProfileScreenProps> = ({ isDarkMode = false, onClose }) => {
  const userId = useSelector((state: RootState) => state.profile.userId);
  const userProfile = useSelector((state: RootState) => state.profile.userProfile);
  const { fetchUserProfile, loading } = useFetchUserProfile(userId || "");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEmailsModal, setShowEmailsModal] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Editable fields state
  const [editedName, setEditedName] = useState('');
  const [editedUsername, setEditedUsername] = useState('');
  const [editedAbout, setEditedAbout] = useState('');
  const [editedLinks, setEditedLinks] = useState<{ key: string; url: string }[]>([]);
  const [tempLink, setTempLink] = useState({ title: '', url: '' });
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Fetch on mount
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Sync local edit state when Redux profile loads
  useEffect(() => {
    if (userProfile) {
      setEditedName(userProfile.name ?? '');
      setEditedUsername(userProfile.userName ?? '');
      setEditedAbout(userProfile.about ?? '');
      setEditedLinks(userProfile.profileLink ?? []);
      setProfileImage(userProfile.profilePictureUrl ?? null);
    }
  }, [userProfile]);

  // Derived read-only values from Redux
  const primaryEmail = userProfile?.primary_email?.email ?? '—';
  const otherEmails = userProfile?.emails?.slice(1) ?? [];
  const phoneNumber = userProfile?.phoneNumber ?? '—';

  const C = {
    bg: isDarkMode ? '#0D1418' : '#F5F5F5',
    cardBg: isDarkMode ? '#1F2C34' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    sub: isDarkMode ? '#A0A0A0' : '#666666',
    border: isDarkMode ? '#2A3942' : '#E0E0E0',
    accent: isDarkMode ? '#00A884' : '#008069',
    inputBg: isDarkMode ? '#2A3942' : '#F5F5F5',
    placeholder: isDarkMode ? '#6C7A7F' : '#999999',
  };

  const handleShareProfile = async () => {
    try {
      const shareMessage = `Check out ${editedName || 'my'} profile on ChatApp!\nUsername: ${editedUsername}\n${userProfile?.profilePictureUrl ? 'Profile picture available' : ''}`;
      await Share.share({
        message: shareMessage,
        title: `${editedName}'s Profile`,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share profile');
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: 'edit',
      label: 'Edit Profile',
      icon: 'create-outline',
      onPress: () => setIsEditing(true),
    },
    {
      id: 'share',
      label: 'Share Profile',
      icon: 'share-outline',
      onPress: handleShareProfile,
    },
  ];

  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (!editedUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    setSaving(true);
    // TODO: wire up update API call
    setTimeout(() => {
      setSaving(false);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    }, 1000);
  };

  const handleImageUpload = async () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Camera permission is required');
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

            if (!result.canceled) {
              uploadImage(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Gallery permission is required');
              return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

            if (!result.canceled) {
              uploadImage(result.assets[0].uri);
            }
          },
        },
      ]
    );
  };

  const uploadImage = async (uri: string) => {
    setUploadingImage(true);
    // TODO: wire up image upload API call
    setTimeout(() => {
      setProfileImage(uri);
      setUploadingImage(false);
      Alert.alert('Success', 'Profile picture updated');
    }, 1500);
  };

  const addLink = () => {
    if (tempLink.title.trim() && tempLink.url.trim()) {
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlPattern.test(tempLink.url) && !tempLink.url.startsWith('http')) {
        Alert.alert('Error', 'Please enter a valid URL');
        return;
      }

      setEditedLinks([...editedLinks, { key: tempLink.title, url: tempLink.url }]);
      setTempLink({ title: '', url: '' });
      setShowLinksModal(false);
    } else {
      Alert.alert('Error', 'Please fill both title and URL');
    }
  };

  const removeLink = (index: number) => {
    Alert.alert(
      'Remove Link',
      'Are you sure you want to remove this link?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newLinks = [...editedLinks];
            newLinks.splice(index, 1);
            setEditedLinks(newLinks);
          },
        },
      ]
    );
  };

  const renderProfileHeader = () => (
    <View style={s.profileHeader}>
      <TouchableOpacity onPress={handleImageUpload} disabled={uploadingImage}>
        <View style={[s.profileImageWrapper, { borderColor: C.accent }]}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={s.profileImage} />
          ) : (
            <View style={[s.profilePlaceholder, { backgroundColor: C.inputBg }]}>
              <Ionicons name="person" size={50} color={C.sub} />
            </View>
          )}
          {uploadingImage && (
            <View style={s.imageOverlay}>
              <ActivityIndicator size="large" color={C.accent} />
            </View>
          )}
          {isEditing && (
            <View style={[s.cameraIcon, { backgroundColor: C.accent }]}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={s.profileInfo}>
        {isEditing ? (
          <TextInput
            style={[s.nameInput, { backgroundColor: C.inputBg, color: C.text, borderColor: C.border }]}
            value={editedName}
            onChangeText={setEditedName}
            placeholder="Your name"
            placeholderTextColor={C.placeholder}
          />
        ) : (
          <Text style={[s.name, { color: C.text }]}>{editedName || 'No name added'}</Text>
        )}
        
        {isEditing ? (
          <TextInput
            style={[s.usernameInput, { backgroundColor: C.inputBg, color: C.text, borderColor: C.border }]}
            value={editedUsername}
            onChangeText={setEditedUsername}
            placeholder="@username"
            placeholderTextColor={C.placeholder}
          />
        ) : (
          <Text style={[s.username, { color: C.sub }]}>@{editedUsername || 'username'}</Text>
        )}
        
        <Text style={[s.phoneNumber, { color: C.sub }]}>{phoneNumber}</Text>
      </View>
    </View>
  );

  const renderEditableField = (
    label: string,
    value: string,
    setValue: (text: string) => void,
    placeholder: string,
    multiline: boolean = false,
    icon: string = 'person-outline'
  ) => (
    <View style={s.fieldContainer}>
      <View style={s.fieldHeader}>
        <Ionicons name={icon as any} size={20} color={C.accent} />
        <Text style={[s.fieldLabel, { color: C.sub }]}>{label}</Text>
      </View>
      {isEditing ? (
        <TextInput
          style={[
            s.input,
            {
              backgroundColor: C.inputBg,
              color: C.text,
              borderColor: C.border,
            },
            multiline && s.textArea,
          ]}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor={C.placeholder}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      ) : (
        <Text style={[s.fieldValue, { color: C.text }]}>
          {value || `No ${label.toLowerCase()} added`}
        </Text>
      )}
    </View>
  );

  const renderNonEditableField = (label: string, value: string, icon: string = 'mail-outline') => (
    <View style={s.fieldContainer}>
      <View style={s.fieldHeader}>
        <Ionicons name={icon as any} size={20} color={C.accent} />
        <Text style={[s.fieldLabel, { color: C.sub }]}>{label}</Text>
      </View>
      <Text style={[s.fieldValue, { color: C.text }]}>{value}</Text>
    </View>
  );

  const renderOtherEmails = () => (
    <View style={s.fieldContainer}>
      <View style={s.fieldHeader}>
        <Ionicons name="mail-outline" size={20} color={C.accent} />
        <Text style={[s.fieldLabel, { color: C.sub }]}>Other Emails</Text>
        <TouchableOpacity onPress={() => setShowEmailsModal(true)}>
          <Ionicons name="information-circle-outline" size={20} color={C.accent} />
        </TouchableOpacity>
      </View>
      <View style={s.emailsList}>
        {otherEmails.map((emailObj, index) => (
          <View key={index} style={[s.emailChip, { backgroundColor: C.inputBg, borderColor: C.border }]}>
            <Text style={[s.emailText, { color: C.text }]}>{emailObj.email}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderLinks = () => (
    <View style={s.fieldContainer}>
      <View style={s.fieldHeader}>
        <Ionicons name="link-outline" size={20} color={C.accent} />
        <Text style={[s.fieldLabel, { color: C.sub }]}>Links</Text>
        {isEditing && (
          <TouchableOpacity onPress={() => setShowLinksModal(true)}>
            <Ionicons name="add-circle-outline" size={22} color={C.accent} />
          </TouchableOpacity>
        )}
      </View>

      {editedLinks.length > 0 ? (
        editedLinks.map((link, index) => (
          <View key={index} style={[s.linkItem, { borderBottomColor: C.border }]}>
            <View style={s.linkContent}>
              <Ionicons name="link-outline" size={16} color={C.accent} />
              <View style={s.linkInfo}>
                <Text style={[s.linkTitle, { color: C.text }]}>{link.key}</Text>
                <Text style={[s.linkUrl, { color: C.sub }]} numberOfLines={1}>
                  {link.url}
                </Text>
              </View>
            </View>
            {isEditing && (
              <TouchableOpacity onPress={() => removeLink(index)}>
                <Ionicons name="trash-outline" size={20} color={C.sub} />
              </TouchableOpacity>
            )}
          </View>
        ))
      ) : (
        <Text style={[s.fieldValue, { color: C.sub }]}>
          {isEditing ? 'Tap + to add links' : 'No links added'}
        </Text>
      )}
    </View>
  );

  // Loading state
  if (loading && !userProfile) {
    return (
      <View style={[s.container, { backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[s.container, { backgroundColor: C.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[s.header, { backgroundColor: C.cardBg, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        
        
        <TouchableOpacity onPress={() => setShowMenu(true)} style={s.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={C.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header with Image and Info */}
        {renderProfileHeader()}

        {/* Edit/Save Button for Edit Mode */}
        {isEditing && (
          <TouchableOpacity
            style={[s.saveButton, { backgroundColor: C.accent }]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={s.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        )}

        {/* About Section */}
        {renderEditableField('About', editedAbout, setEditedAbout, 'Tell something about yourself', true, 'information-circle-outline')}

        {/* Emails Section */}
        {renderNonEditableField('Primary Email', primaryEmail, 'mail-outline')}
        {otherEmails.length > 0 && renderOtherEmails()}

        {/* Links Section */}
        {renderLinks()}
      </ScrollView>

      {/* Modal Menu */}
      <ModalMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        menuItems={menuItems}
        menuWidth={200}
      />

      {/* Other Emails Modal */}
      <Modal
        visible={showEmailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmailsModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: C.cardBg }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: C.text }]}>Other Email Addresses</Text>
              <TouchableOpacity onPress={() => setShowEmailsModal(false)}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {otherEmails.map((emailObj, index) => (
                <View key={index} style={[s.modalEmailItem, { borderBottomColor: C.border }]}>
                  <Ionicons name="mail-outline" size={20} color={C.accent} />
                  <Text style={[s.modalEmailText, { color: C.text }]}>{emailObj.email}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Link Modal */}
      <Modal
        visible={showLinksModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLinksModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: C.cardBg }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: C.text }]}>Add Link</Text>
              <TouchableOpacity onPress={() => setShowLinksModal(false)}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            <View style={s.modalField}>
              <Text style={[s.modalLabel, { color: C.sub }]}>Title</Text>
              <TextInput
                style={[s.modalInput, { backgroundColor: C.inputBg, color: C.text, borderColor: C.border }]}
                value={tempLink.title}
                onChangeText={(text) => setTempLink({ ...tempLink, title: text })}
                placeholder="e.g., GitHub, Portfolio, LinkedIn"
                placeholderTextColor={C.placeholder}
              />
            </View>

            <View style={s.modalField}>
              <Text style={[s.modalLabel, { color: C.sub }]}>URL</Text>
              <TextInput
                style={[s.modalInput, { backgroundColor: C.inputBg, color: C.text, borderColor: C.border }]}
                value={tempLink.url}
                onChangeText={(text) => setTempLink({ ...tempLink, url: text })}
                placeholder="https://..."
                placeholderTextColor={C.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[s.addLinkButton, { backgroundColor: C.accent }]}
              onPress={addLink}
            >
              <Text style={s.addLinkButtonText}>Add Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  menuButton: {
    padding: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  profileImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 20,
    padding: 8,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 22,
    fontWeight: '600',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  username: {
    fontSize: 14,
    marginBottom: 4,
  },
  usernameInput: {
    fontSize: 14,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 14,
  },
  saveButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fieldContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  fieldValue: {
    fontSize: 16,
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emailsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  emailChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  emailText: {
    fontSize: 14,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  linkUrl: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalEmailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalEmailText: {
    fontSize: 16,
    flex: 1,
  },
  modalField: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  modalInput: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  addLinkButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addLinkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatProfileScreen;