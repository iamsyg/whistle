// frontend/app/(auth)/profile-setup.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';;
import { setName, setUserName, setAbout, setProfileLink, setProfilePictureUrl} from '../../store/slices/auth/profileSlice';

// Type definitions
type ProfileLink = {
  id: string;
  value: string;
};

type ProfileData = {
  name: string;
  username: string;
  about: string;
  profileImage: string | null;
  links: ProfileLink[];
};

const MAX_ABOUT_LENGTH = 140;
const MAX_LINKS = 3; // Maximum number of links allowed

const ProfileSetup: React.FC = () => {
  // State
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    username: '',
    about: '',
    profileImage: null,
    links: [],
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const dispatch = useDispatch<AppDispatch>();

  const profile = useSelector((state: RootState) => state.profile);

  React.useEffect(() => {
    setProfileData({
      name: profile.userProfile?.name || '',
      username: profile.userProfile?.userName || '',
      about: profile.userProfile?.about || '',
      profileImage: profile.userProfile?.profilePictureUrl || null,
      links: profile.userProfile?.profileLink.map((link) => ({ id: link.key, value: link.url })) || [],
    });
  }, [
    profile.userProfile?.name,
    profile.userProfile?.userName,
    profile.userProfile?.about,
    profile.userProfile?.profilePictureUrl,
    profile.userProfile?.profileLink,
  ]);




  // Image Picker
  const pickImage = async () => {
    Animated.timing(fadeAnim, {
      toValue: 0.7,
      duration: 200,
      useNativeDriver: true,
    }).start();

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (!result.canceled && result.assets[0]) {
      setProfileData(prev => ({
        ...prev,
        profileImage: result.assets[0].uri,
      }));
    }
  };

  // Input Handlers
  const handleNameChange = (text: string) => {
    setProfileData(prev => ({ ...prev, name: text }));
  };

  const handleUsernameChange = (text: string) => {
  setProfileData(prev => ({
    ...prev,
    username: text.replace(/\s/g, ''),
  }));
};

  const handleAboutChange = (text: string) => {
    if (text.length <= MAX_ABOUT_LENGTH) {
      setProfileData(prev => ({ ...prev, about: text }));
    }
  };

  const handleLinkChange = (id: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      links: prev.links.map(link =>
        link.id === id ? { ...link, value } : link
      ),
    }));
  };

  const addLink = () => {
  if (profileData.links.length >= MAX_LINKS) {
    Alert.alert(`You can only add ${MAX_LINKS} links`);
    return;
  }

  setProfileData(prev => ({
    ...prev,
    links: [
      ...prev.links,
      { id: Date.now().toString(), value: '' },
    ],
  }));
};


  const removeLink = (id: string) => {
    setProfileData(prev => ({
      ...prev,
      links: prev.links.filter(link => link.id !== id),
    }));
  };

  // Validation
  const validateLink = (url: string): boolean => {
    if (!url) return true;
    const pattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return pattern.test(url);
  };

  const isNameValid = profileData.name.trim().length > 0;
  const areLinksValid = profileData.links.every(link => validateLink(link.value));
  const hasMaxLinks = profileData.links.length >= MAX_LINKS;

  // Submit Handler
  const handleSubmit = async () => {
    if (!isNameValid) {
      Alert.alert('Required Field', 'Please enter your name to continue.');
      return;
    }

    if (!areLinksValid) {
      Alert.alert('Invalid URL', 'Please check your profile links. They should be valid URLs.');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      dispatch(setName(profileData.name));
      if (profileData.profileImage) {
        dispatch(setProfilePictureUrl(profileData.profileImage));
      }
      dispatch(setUserName(profileData.username));
      dispatch(setAbout(profileData.about));
      dispatch(setProfileLink(profileData.links.map(link => ({ url: link.id, key: link.value }))));
      Alert.alert(
        'Profile Updated',
        'Your profile has been saved successfully!',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/Chats') }]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile Setup</Text>
          <Text style={styles.subtitle}>
            Complete your profile to get started
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Image & Name */}
          <View style={styles.profileSection}>
            <Animated.View style={{ opacity: fadeAnim }}>
              <TouchableOpacity
                style={styles.profileImageContainer}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                {profileData.profileImage ? (
                  <Image
                    source={{ uri: profileData.profileImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <FontAwesome name="user" size={40} color="#666" />
                  </View>
                )}
                <View style={styles.cameraIconContainer}>
                  <Ionicons name="camera" size={20} color="white" />
                </View>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.nameInputContainer}>
              <Text style={styles.label}>
                Your name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  !isNameValid && profileData.name.length > 0 && styles.inputError,
                ]}
                placeholder="Your name"
                placeholderTextColor="#999"
                value={profileData.name}
                onChangeText={handleNameChange}
                autoFocus
              />
              {!isNameValid && profileData.name.length > 0 && (
                <Text style={styles.errorText}>Name is required</Text>
              )}
            </View>
          </View>

          {/* Username */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Username <Text style={styles.optionalText}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Username (optional)"
              placeholderTextColor="#999"
              value={profileData.username}
              onChangeText={handleUsernameChange}
            />
            <Text style={styles.helperText}>Visible to others</Text>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.label}>
              About <Text style={styles.optionalText}>(optional)</Text>
            </Text>
            <View style={styles.aboutContainer}>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="About (optional)"
                placeholderTextColor="#999"
                value={profileData.about}
                onChangeText={handleAboutChange}
                multiline
                numberOfLines={3}
                maxLength={MAX_ABOUT_LENGTH}
              />
              <View style={styles.charCounterContainer}>
                <Text style={styles.charCounter}>
                  {profileData.about.length}/{MAX_ABOUT_LENGTH}
                </Text>
              </View>
            </View>
          </View>

          {/* Profile Links */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.label}>
                  Profile Links <Text style={styles.optionalText}>(optional)</Text>
                </Text>
                <Text style={styles.linkCounter}>
                  {profileData.links.length}/{MAX_LINKS}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addButton, hasMaxLinks && styles.disabledButton]}
                onPress={() => addLink()}
                disabled={hasMaxLinks}
              >
                <Ionicons 
                  name="add-circle" 
                  size={24} 
                  color={hasMaxLinks ? "#999" : "#007AFF"} 
                />
              </TouchableOpacity>
            </View>

            {profileData.links.map(link => (
              <View key={link.id} style={styles.linkItem}>
                <View style={styles.linkInputWrapper}>
                  <TextInput
                    style={styles.linkInput}
                    placeholder="https://your-link.com"
                    placeholderTextColor="#999"
                    value={link.value}
                    onChangeText={(text) =>
                      handleLinkChange(link.id, text)
                    }
                    autoCapitalize="none"
                    keyboardType="url"
                  />

                  <TouchableOpacity
                    style={styles.removeLinkButton}
                    onPress={() => removeLink(link.id)}
                  >
                    <MaterialIcons name="remove-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {hasMaxLinks && (
              <View style={styles.maxLinksMessage}>
                <Ionicons name="information-circle-outline" size={16} color="#666" />
                <Text style={styles.maxLinksText}>
                  Maximum {MAX_LINKS} links reached
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!isNameValid || isLoading) && styles.primaryButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isNameValid || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Save & Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1971c2',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '90%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
    marginBottom: 32,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  nameInputContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  linkCounter: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  requiredStar: {
    color: '#FF3B30',
  },
  optionalText: {
    fontWeight: '400',
    color: '#666',
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
  },
  linkInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  linkInput: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    marginRight: 12,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  helperText: {
    color: '#666',
    fontSize: 14,
    marginTop: 6,
  },
  aboutContainer: {
    position: 'relative',
  },
  charCounterContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  charCounter: {
    fontSize: 12,
    color: '#666',
  },
  linkItem: {
    marginBottom: 12,
    width: '100%',
  },
  addButton: {
    padding: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  removeLinkButton: {
    padding: 4,
  },
  maxLinksMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  maxLinksText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingBottom: Platform.OS === 'ios' ? 4 : 1,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: '#C7D7FE',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default ProfileSetup;