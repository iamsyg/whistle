// app/(screens)/createClassroom.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Clipboard,
  Platform,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Header from '@/components/Header';

interface InviteAdmin {
  email: string;
  name?: string;
}

interface InviteMember {
  email: string;
  name?: string;
}

export default function CreateClassroom() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  
  // REQUIRED EMAIL MODE SETTINGS
  const [requireEmail, setRequireEmail] = useState(true); // Default: email required
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [domainError, setDomainError] = useState('');
  
  // Admins Data
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminEmailError, setAdminEmailError] = useState('');
  
  // Members Data
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [memberEmailError, setMemberEmailError] = useState('');

  // Validate email function
  const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Validate domain format
  const isValidDomain = (domain: string) => {
    const re = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return re.test(domain.trim());
  };

  // Check if email matches allowed domains
  const emailMatchesAllowedDomain = (email: string): boolean => {
    if (allowedDomains.length === 0) return true; // No restrictions
    
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain) return false;
    
    return allowedDomains.some(domain => 
      emailDomain === domain.toLowerCase() || 
      emailDomain.endsWith(`.${domain.toLowerCase()}`)
    );
  };

  // Add allowed domain
  const handleAddDomain = () => {
    const domain = newDomain.trim();
    if (!domain) {
      setDomainError('Domain is required');
      return;
    }
    
    if (!isValidDomain(domain)) {
      setDomainError('Please enter a valid domain (e.g., example.com)');
      return;
    }
    
    if (allowedDomains.includes(domain.toLowerCase())) {
      setDomainError('Domain already added');
      return;
    }
    
    setAllowedDomains([...allowedDomains, domain.toLowerCase()]);
    setNewDomain('');
    setDomainError('');
  };

  // Remove domain
  const removeDomain = (domain: string) => {
    setAllowedDomains(allowedDomains.filter(d => d !== domain));
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(text);
    } else {
      Clipboard.setString(text);
    }
    Alert.alert('Copied!', 'Link copied to clipboard');
  };

  // Handle CSV/Excel file upload
  const handleFileUpload = async (type: 'admin' | 'member') => {
    if (requireEmail) {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ],
          multiple: false,
        });

        if (result.canceled) return;

        const file = result.assets?.[0];
        if (!file?.uri) {
          Alert.alert('Error', 'Invalid file selected');
          return;
        }

        setIsLoading(true);

        const content = await FileSystem.readAsStringAsync(file.uri);

        const emails = content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => {
            const email = line.split(',')[0]?.trim();
            if (!email || !isValidEmail(email)) return false;
            
            // Check domain restrictions if any
            if (allowedDomains.length > 0) {
              return emailMatchesAllowedDomain(email);
            }
            return true;
          })
          .map((line) => line.split(',')[0]?.trim());

        if (!emails.length) {
          const message = allowedDomains.length > 0 
            ? `No valid emails found. All emails must be from: ${allowedDomains.join(', ')}`
            : 'No valid emails found';
          Alert.alert('No valid emails', message);
          return;
        }

        if (type === 'admin') {
          setAdminEmails((prev) => [...new Set([...prev, ...emails])]);
        } else {
          setMemberEmails((prev) => [...new Set([...prev, ...emails])]);
        }

        Alert.alert('Success', `Added ${emails.length} emails`);

      } catch (error) {
        console.error('File upload error:', error);
        Alert.alert('Error', 'Failed to upload file');
      } finally {
        setIsLoading(false);
      }
    } else {
      Alert.alert('Info', 'File upload is only available when email is required');
    }
  };

  // Add admin email
  const handleAddAdminEmail = () => {
    if (!requireEmail) {
      Alert.alert('Info', 'Email mode is turned off. Admins will join via username/phone');
      return;
    }
    
    const email = newAdminEmail.trim();
    if (!email) {
      setAdminEmailError('Email is required');
      return;
    }
    
    if (!isValidEmail(email)) {
      setAdminEmailError('Please enter a valid email');
      return;
    }
    
    // Check domain restrictions
    if (allowedDomains.length > 0 && !emailMatchesAllowedDomain(email)) {
      setAdminEmailError(`Email must be from: ${allowedDomains.join(', ')}`);
      return;
    }
    
    if (adminEmails.includes(email)) {
      setAdminEmailError('Email already added');
      return;
    }
    
    setAdminEmails([...adminEmails, email]);
    setNewAdminEmail('');
    setAdminEmailError('');
  };

  // Add member email
  const handleAddMemberEmail = () => {
    if (!requireEmail) {
      Alert.alert('Info', 'Email mode is turned off. Members will join via username/phone');
      return;
    }
    
    const email = newMemberEmail.trim();
    if (!email) {
      setMemberEmailError('Email is required');
      return;
    }
    
    if (!isValidEmail(email)) {
      setMemberEmailError('Please enter a valid email');
      return;
    }
    
    // Check domain restrictions
    if (allowedDomains.length > 0 && !emailMatchesAllowedDomain(email)) {
      setMemberEmailError(`Email must be from: ${allowedDomains.join(', ')}`);
      return;
    }
    
    if (memberEmails.includes(email)) {
      setMemberEmailError('Email already added');
      return;
    }
    
    setMemberEmails([...memberEmails, email]);
    setNewMemberEmail('');
    setMemberEmailError('');
  };

  // Remove email from list
  const removeEmail = (email: string, type: 'admin' | 'member') => {
    if (type === 'admin') {
      setAdminEmails(adminEmails.filter(e => e !== email));
    } else {
      setMemberEmails(memberEmails.filter(e => e !== email));
    }
  };

  // Clear email lists when switching modes
  useEffect(() => {
    if (!requireEmail) {
      setAdminEmails([]);
      setMemberEmails([]);
      setAllowedDomains([]);
      setAdminEmailError('');
      setMemberEmailError('');
      setDomainError('');
    }
  }, [requireEmail]);

  // Validate form and create classroom
  const handleCreateClassroom = async () => {
    // Validate title
    if (!title.trim()) {
      setTitleError('Classroom title is required');
      return;
    }

    // Validate email requirements if mode is on
    // if (requireEmail) {
    //   if (adminEmails.length === 0 && memberEmails.length === 0) {
    //     Alert.alert('Warning', 
    //       'No emails added. Classroom will be created without any initial participants. ' +
    //       'You can invite them later via username/phone.');
    //   }
    // }

    setIsLoading(true);
    
    try {
      // Here you would make your API call to create the classroom
      // const response = await createClassroomAPI({
      //   title,
      //   requireEmail,
      //   allowedDomains: requireEmail ? allowedDomains : [],
      //   adminEmails: requireEmail ? adminEmails : [],
      //   memberEmails: requireEmail ? memberEmails : [],
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Success!',
        `Classroom created successfully! ${requireEmail ? 
          'Participants will join via email.' : 
          'Participants can join via username or phone.'}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to create classroom. Please try again.');
      console.error('Create classroom error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Create Classroom"
        showSearch={false}
        showBackButton={true}
        onBackPress={() => router.back()}
        menuItems={[
          {
            id: '1',
            label: 'Help & Support',
            icon: 'help-circle-outline',
            onPress: () => Alert.alert('Help', 'Contact support for assistance'),
          },
          {
            id: '2',
            label: 'Classroom Guide',
            icon: 'book-outline',
            onPress: () => Alert.alert('Guide', 'How to create classrooms'),
          },
        ]}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Classroom Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Classroom Title *</Text>
          <TextInput
            style={[styles.input, titleError ? styles.inputError : null]}
            placeholder="Enter classroom title"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (titleError) setTitleError('');
            }}
            editable={!isLoading}
          />
          {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
        </View>

        {/* Email Mode Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleContainer}>
            <View style={styles.toggleLabelContainer}>
              <Ionicons name="mail-outline" size={20} color="#1971c2" />
              <Text style={styles.sectionTitle}>Require Email</Text>
            </View>
            <Switch
              value={requireEmail}
              onValueChange={setRequireEmail}
              trackColor={{ false: '#ddd', true: '#bbdefb' }}
              thumbColor={requireEmail ? '#1971c2' : '#f4f3f4'}
              disabled={isLoading}
            />
          </View>
          <Text style={styles.toggleDescription}>
            {requireEmail 
              ? 'Participants must join using email addresses'
              : 'Participants can join via username or phone number'}
          </Text>
        </View>

        {/* Conditional Rendering Based on Email Mode */}
        {requireEmail ? (
          <>
            {/* Allowed Domains Section (Optional) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Allowed Email Domains (Optional)</Text>
              <Text style={styles.subtitle}>
                Restrict emails to specific domains. Leave empty to allow any email.
              </Text>
              
              <View style={styles.domainInputContainer}>
                <TextInput
                  style={[styles.domainInput, domainError ? styles.inputError : null]}
                  placeholder="e.g., example.com"
                  value={newDomain}
                  onChangeText={(text) => {
                    setNewDomain(text);
                    if (domainError) setDomainError('');
                  }}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddDomain}
                  disabled={isLoading}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              {domainError ? <Text style={styles.errorText}>{domainError}</Text> : null}
              
              {/* Domain List */}
              {allowedDomains.length > 0 && (
                <View style={styles.domainListSection}>
                  <Text style={styles.emailListTitle}>Allowed Domains ({allowedDomains.length})</Text>
                  <View style={styles.domainList}>
                    {allowedDomains.map((domain, index) => (
                      <View key={index} style={styles.domainItem}>
                        <Text style={styles.domainText}>@{domain}</Text>
                        <TouchableOpacity
                          onPress={() => removeDomain(domain)}
                          disabled={isLoading}
                        >
                          <Ionicons name="close-circle" size={20} color="#ff6b6b" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.domainHint}>
                    All emails must be from one of these domains
                  </Text>
                </View>
              )}
            </View>

            {/* Invite Members Section - EMAIL MODE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Invite Members</Text>
              
              {/* Or Upload File */}
              <View style={styles.fileSection}>
                <Text style={styles.subtitle}>Upload File:</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleFileUpload('member')}
                  disabled={isLoading}
                >
                  <Ionicons name="document-outline" size={20} color="#1971c2" />
                  <Text style={styles.uploadButtonText}>
                    Upload CSV/Excel with Member Emails
                  </Text>
                </TouchableOpacity>
                <Text style={styles.fileHint}>
                  {allowedDomains.length > 0 
                    ? `Only emails from: ${allowedDomains.join(', ')}`
                    : 'Upload CSV or Excel file containing member email addresses'}
                </Text>
              </View>

              {/* Or Add Manually */}
              <View style={styles.manualAddSection}>
                <Text style={styles.subtitle}>Or Add Manually:</Text>
                <View style={styles.emailInputContainer}>
                  <TextInput
                    style={[styles.emailInput, memberEmailError ? styles.inputError : null]}
                    placeholder="Enter member email"
                    value={newMemberEmail}
                    onChangeText={(text) => {
                      setNewMemberEmail(text);
                      if (memberEmailError) setMemberEmailError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddMemberEmail}
                    disabled={isLoading}
                  >
                    <Ionicons name="add" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                {memberEmailError ? <Text style={styles.errorText}>{memberEmailError}</Text> : null}
              </View>

              {/* Member Email List */}
              {memberEmails.length > 0 && (
                <View style={styles.emailListSection}>
                  <Text style={styles.emailListTitle}>Member Emails ({memberEmails.length})</Text>
                  <View style={styles.emailList}>
                    {memberEmails.map((email, index) => (
                      <View key={index} style={styles.emailItem}>
                        <Text style={styles.emailText}>{email}</Text>
                        <TouchableOpacity
                          onPress={() => removeEmail(email, 'member')}
                          disabled={isLoading}
                        >
                          <Ionicons name="close-circle" size={20} color="#ff6b6b" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </>
        ) : (
          /* NON-EMAIL MODE UI */
          <View style={styles.section}>
            <View style={styles.nonEmailModeCard}>
              <Ionicons name="people-outline" size={40} color="#1971c2" style={styles.modeIcon} />
              <Text style={styles.modeTitle}>Non-Email Mode</Text>
              <Text style={styles.modeDescription}>
                Participants can join this classroom using:
              </Text>
              <View style={styles.modeFeatures}>
                <View style={styles.featureItem}>
                  <Ionicons name="person-outline" size={20} color="#1971c2" />
                  <Text style={styles.featureText}>Username</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="phone-portrait-outline" size={20} color="#1971c2" />
                  <Text style={styles.featureText}>Phone Number</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="link-outline" size={20} color="#1971c2" />
                  <Text style={styles.featureText}>Invite Links</Text>
                </View>
              </View>
              <Text style={styles.modeHint}>
                You can invite participants after creating the classroom
              </Text>
            </View>
          </View>
        )}

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateClassroom}
          disabled={isLoading || !title.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.createButtonText}>
              {requireEmail ? 'Create Classroom with Email' : 'Create Classroom without Email'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
  },
  // Toggle Styles
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Domain Input Styles
  domainInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  domainInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  domainListSection: {
    marginTop: 16,
  },
  domainList: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e1f5fe',
  },
  domainItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1f5fe',
  },
  domainText: {
    fontSize: 14,
    color: '#1971c2',
    fontWeight: '500',
  },
  domainHint: {
    fontSize: 12,
    color: '#1971c2',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // File Section
  fileSection: {
    marginBottom: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbdefb',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginLeft: 8,
    color: '#1971c2',
    fontWeight: '500',
  },
  fileHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  // Manual Add Section
  manualAddSection: {
    marginBottom: 20,
  },
  emailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  addButton: {
    backgroundColor: '#1971c2',
    borderRadius: 8,
    padding: 10,
    marginLeft: 8,
  },
  emailListSection: {
    marginTop: 8,
  },
  emailListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emailList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 8,
    maxHeight: 200,
  },
  emailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  emailText: {
    fontSize: 14,
    color: '#333',
  },
  // Non-Email Mode Styles
  nonEmailModeCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e3f2fd',
    borderStyle: 'dashed',
  },
  modeIcon: {
    marginBottom: 12,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1971c2',
    marginBottom: 8,
  },
  modeDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  modeFeatures: {
    width: '100%',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  modeHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Create Button
  createButton: {
    backgroundColor: '#1971c2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});