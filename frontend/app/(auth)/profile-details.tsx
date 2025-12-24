// frontend/app/(auth)/profile-details.tsx

// username add up

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import { 
  ProfileLink, 
  INITIAL_PROFILE_LINKS, 
  MAX_PROFILE_LINKS,
  SOCIAL_LINK_OPTIONS,
  SocialLinkOption
} from '../../constants/profileLinks';

interface ProfileData {
  name: string;
  about: string;
  profileImage: string | null;
  links: ProfileLink[];
}

interface ValidationErrors {
  name?: string;
  links?: { [key: string]: string };
}

const { width } = Dimensions.get('window');

export default function ProfileDetailsScreen() {
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    about: '',
    profileImage: null,
    links: INITIAL_PROFILE_LINKS,
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);
  
  const nameInputRef = useRef<TextInput>(null);
  const aboutInputRef = useRef<TextInput>(null);

  // Validate name field
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return 'Name is required';
    }
    if (name.length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (name.length > 50) {
      return 'Name must be less than 50 characters';
    }
    return undefined;
  };

  // Validate URL format
  const validateUrl = (url: string): string | undefined => {
    if (!url.trim()) return undefined; // Empty is okay
    
    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlPattern.test(url)) {
      return 'Please enter a valid URL';
    }
    return undefined;
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    const linkErrors: { [key: string]: string } = {};
    
    // Validate name
    const nameError = validateName(profile.name);
    if (nameError) newErrors.name = nameError;
    
    // Validate each link
    profile.links.forEach((link) => {
      const linkError = validateUrl(link.value);
      if (linkError && link.value.trim()) {
        linkErrors[link.id] = linkError;
      }
    });
    
    if (Object.keys(linkErrors).length > 0) {
      newErrors.links = linkErrors;
    }
    
    setErrors(newErrors);
    const isValid = !newErrors.name && (!newErrors.links || Object.keys(newErrors.links).length === 0);
    setIsFormValid(isValid);
    
    return isValid;
  };

  // Handle input changes
  const handleInputChange = (field: keyof ProfileData, value: string | ProfileLink[] | null) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user types
    if (field === 'name' && errors.name) {
      const newErrors = { ...errors };
      delete newErrors.name;
      setErrors(newErrors);
    }
  };

  // Handle link input change
  const handleLinkChange = (id: string, value: string) => {
    const newLinks = profile.links.map(link => 
      link.id === id ? { ...link, value } : link
    );
    setProfile(prev => ({ ...prev, links: newLinks }));
    
    // Clear error for this link
    if (errors.links?.[id]) {
      const newLinkErrors = { ...errors.links };
      delete newLinkErrors[id];
      setErrors(prev => ({ ...prev, links: newLinkErrors }));
    }
  };

  // Add a new link field
  const addLinkField = () => {
    if (profile.links.length >= MAX_PROFILE_LINKS) {
      Alert.alert(
        'Maximum Links',
        `You can add up to ${MAX_PROFILE_LINKS} profile links.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const newLinkId = `link-${Date.now()}`;
    const newLink: ProfileLink = {
      id: newLinkId,
      type: 'website',
      value: '',
      placeholder: 'https://example.com'
    };

    setProfile(prev => ({ ...prev, links: [...prev.links, newLink] }));
  };

  // Remove a link field
  const removeLinkField = (id: string) => {
    if (profile.links.length <= 1) return;
    
    Alert.alert(
      'Remove Link',
      'Are you sure you want to remove this link?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            const newLinks = profile.links.filter(link => link.id !== id);
            setProfile(prev => ({ ...prev, links: newLinks }));
            
            // Clear error for removed link
            if (errors.links?.[id]) {
              const newLinkErrors = { ...errors.links };
              delete newLinkErrors[id];
              setErrors(prev => ({ ...prev, links: newLinkErrors }));
            }
          }
        },
      ]
    );
  };

  // Select profile image from gallery
  const pickProfileImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please allow access to your photos to select a profile image.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setProfile(prev => ({ ...prev, profileImage: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Remove profile image
  const removeProfileImage = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setProfile(prev => ({ ...prev, profileImage: null }))
        },
      ]
    );
  };

  // Handle Save & Continue
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert(
        'Required Field',
        'Name is required to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);

    try {
      // Simulate API call to save profile
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const filteredLinks = profile.links
        .filter(link => link.value.trim())
        .map(link => ({
          type: link.type,
          value: link.value,
        }));
      
      console.log('Profile details saved:', {
        name: profile.name,
        about: profile.about || 'Not provided',
        profileImage: profile.profileImage ? 'Uploaded' : 'Not provided',
        links: filteredLinks.length > 0 ? filteredLinks : 'Not provided',
      });
      
      // Navigate to home screen
      router.replace('/(tabs)/home');
      
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to save profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Validate form when profile changes
  useEffect(() => {
    validateForm();
  }, [profile]);

  // Auto-focus name input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Calculate remaining characters for about section
  const aboutCharCount = profile.about.length;
  const maxAboutChars = 160;
  const aboutRemainingChars = maxAboutChars - aboutCharCount;

  // Get icon for link type
  const getLinkIcon = (linkType: string) => {
    const option = SOCIAL_LINK_OPTIONS.find(opt => opt.id === linkType) || SOCIAL_LINK_OPTIONS[0];
    return option.icon;
  };

  // Get placeholder for link type
  const getLinkPlaceholder = (linkType: string) => {
    const option = SOCIAL_LINK_OPTIONS.find(opt => opt.id === linkType) || SOCIAL_LINK_OPTIONS[0];
    return option.placeholder;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 40}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.container}>
              {/* Header Section */}
              <View style={styles.header}>
                <Text style={styles.title}>Complete Your Profile</Text>
              </View>

              {/* Profile Photo Section */}
              <View style={styles.photoSection}>
                <View style={styles.avatarContainer}>
                  <Avatar
                    size={140}
                    source={profile.profileImage}
                    onPress={pickProfileImage}
                    showCameraOverlay={true}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={[
                      styles.photoActionButton,
                      styles.primaryActionButton,
                    ]}
                    onPress={pickProfileImage}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={profile.profileImage ? "camera" : "add"} 
                      size={18} 
                      color="#1971c2" 
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.primaryActionText}>
                      {profile.profileImage ? 'Change Photo' : 'Add Photo'}
                    </Text>
                  </TouchableOpacity>
                  
                  {profile.profileImage && (
                    <TouchableOpacity
                      style={styles.photoActionButton}
                      onPress={removeProfileImage}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name="close" 
                        size={18} 
                        color="#ff6b6b" 
                        style={styles.buttonIcon}
                      />
                      <Text style={styles.removeActionText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Form Section */}
              <View style={styles.form}>
                {/* Name Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.inputLabel}>Your Name</Text>
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>Required</Text>
                    </View>
                  </View>
                  <TextInput
                    ref={nameInputRef}
                    style={[
                      styles.input,
                      errors.name && styles.inputError,
                      profile.name && styles.inputFilled,
                    ]}
                    value={profile.name}
                    onChangeText={(text) => handleInputChange('name', text)}
                    placeholder="Enter your full name"
                    placeholderTextColor="#999"
                    autoCapitalize="words"
                    editable={!loading}
                    maxLength={50}
                    returnKeyType="next"
                    onSubmitEditing={() => aboutInputRef.current?.focus()}
                  />
                  {errors.name ? (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  ) : (
                    <Text style={styles.helperText}>
                      This is how you'll appear to others
                    </Text>
                  )}
                </View>

                {/* About Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.inputLabel}>About You</Text>
                    <Text style={styles.optionalText}>Optional</Text>
                  </View>
                  <View style={styles.aboutContainer}>
                    <TextInput
                      ref={aboutInputRef}
                      style={[
                        styles.aboutInput,
                        profile.about && styles.inputFilled,
                      ]}
                      value={profile.about}
                      onChangeText={(text) => handleInputChange('about', text)}
                      placeholder="Tell us a bit about yourself..."
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={4}
                      maxLength={maxAboutChars}
                      textAlignVertical="top"
                      editable={!loading}
                      returnKeyType="next"
                    />
                    <View style={styles.charCountContainer}>
                      <Text style={[
                        styles.charCount,
                        aboutRemainingChars < 20 && styles.charCountWarning,
                        aboutRemainingChars <= 0 && styles.charCountError
                      ]}>
                        {aboutRemainingChars}
                      </Text>
                      <Text style={styles.charCountLabel}>/ {maxAboutChars}</Text>
                    </View>
                  </View>
                  <Text style={styles.helperText}>
                    Brief introduction (max {maxAboutChars} characters)
                  </Text>
                </View>

                {/* Profile Links Section */}
                <View style={styles.linksSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Profile Links</Text>
                    <Text style={styles.optionalText}>Optional</Text>
                  </View>
                  
                  <Text style={styles.sectionDescription}>
                    Add your website and social profiles (max {MAX_PROFILE_LINKS})
                  </Text>
                  
                  {profile.links.map((link, index) => (
                    <View key={link.id} style={styles.linkContainer}>
                      <View style={styles.linkHeader}>
                        <View style={styles.linkTypeContainer}>
                          <Ionicons 
                            name={getLinkIcon(link.type) as any} 
                            size={18} 
                            color="#666" 
                            style={styles.linkIcon}
                          />
                          <Text style={styles.linkTypeLabel}>
                            {SOCIAL_LINK_OPTIONS.find(opt => opt.id === link.type)?.label || 'Website'}
                          </Text>
                        </View>
                        {profile.links.length > 1 && (
                          <TouchableOpacity
                            onPress={() => removeLinkField(link.id)}
                            disabled={loading}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="close-circle" size={22} color="#ff6b6b" />
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      <TextInput
                        style={[
                          styles.linkInput,
                          errors.links?.[link.id] && styles.inputError,
                          link.value && styles.inputFilled,
                        ]}
                        value={link.value}
                        onChangeText={(text) => handleLinkChange(link.id, text)}
                        placeholder={getLinkPlaceholder(link.type)}
                        placeholderTextColor="#999"
                        keyboardType="url"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                        autoComplete="off"
                      />
                      
                      {errors.links?.[link.id] && (
                        <Text style={styles.linkErrorText}>
                          {errors.links[link.id]}
                        </Text>
                      )}
                    </View>
                  ))}
                  
                  {profile.links.length < MAX_PROFILE_LINKS && (
                    <TouchableOpacity
                      style={styles.addLinkButton}
                      onPress={addLinkField}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <View style={styles.addLinkIcon}>
                        <Ionicons name="add" size={20} color="#1971c2" />
                      </View>
                      <Text style={styles.addLinkText}>Add Another Link</Text>
                      <Text style={styles.addLinkSubtext}>
                        ({MAX_PROFILE_LINKS - profile.links.length} remaining)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color="#1971c2" />
                  <Text style={styles.infoText}>
                    You can update all these details later in your profile settings.
                  </Text>
                </View>

                {/* Action Button */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      (!isFormValid || loading) && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={!isFormValid || loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <View style={styles.buttonContent}>
                        <Text style={styles.saveButtonText}>Continue</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
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
    maxWidth: width * 0.8,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    gap: 16,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  primaryActionButton: {
    backgroundColor: '#f0f9ff',
    borderColor: '#e7f5ff',
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryActionText: {
    fontSize: 14,
    color: '#1971c2',
    fontWeight: '600',
  },
  removeActionText: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 28,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  requiredBadge: {
    backgroundColor: '#fff5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requiredText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  optionalText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: 56,
  },
  inputFilled: {
    backgroundColor: '#fff',
    borderColor: '#1971c2',
  },
  inputError: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  helperText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 18,
  },
  aboutContainer: {
    position: 'relative',
  },
  aboutInput: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCountContainer: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  charCountLabel: {
    fontSize: 12,
    color: '#666',
  },
  charCountWarning: {
    color: '#ff922b',
  },
  charCountError: {
    color: '#ff6b6b',
  },
  linksSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionDescription: {
    color: '#666',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  linkContainer: {
    marginBottom: 20,
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkIcon: {
    marginRight: 8,
  },
  linkTypeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  linkInput: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: 56,
  },
  linkErrorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  addLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#e7f5ff',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginTop: 8,
  },
  addLinkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e7f5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addLinkText: {
    fontSize: 16,
    color: '#1971c2',
    fontWeight: '600',
  },
  addLinkSubtext: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e7f5ff',
  },
  infoText: {
    flex: 1,
    color: '#1971c2',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
  actions: {
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#1971c2',
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1971c2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#a5d8ff',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  saveButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
});