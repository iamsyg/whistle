// app/(screens)/createClassroom.tsx

import React, { useState } from 'react';
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
  
  // Invite Links
  const [adminInviteLink, setAdminInviteLink] = useState('');
  const [memberInviteLink, setMemberInviteLink] = useState('');
  
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

  // Generate invite links
  const generateInviteLinks = () => {
    const classroomId = `class_${Date.now()}`;
    const adminLink = `https://yourapp.com/invite/admin/${classroomId}`;
    const memberLink = `https://yourapp.com/invite/member/${classroomId}`;
    
    setAdminInviteLink(adminLink);
    setMemberInviteLink(memberLink);
    return { adminLink, memberLink };
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
      .filter((line) => isValidEmail(line.split(',')[0]?.trim()))
      .map((line) => line.split(',')[0]?.trim());

    if (!emails.length) {
      Alert.alert('No valid emails found');
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
};


  // Add admin email
  const handleAddAdminEmail = () => {
    const email = newAdminEmail.trim();
    if (!email) {
      setAdminEmailError('Email is required');
      return;
    }
    
    if (!isValidEmail(email)) {
      setAdminEmailError('Please enter a valid email');
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
    const email = newMemberEmail.trim();
    if (!email) {
      setMemberEmailError('Email is required');
      return;
    }
    
    if (!isValidEmail(email)) {
      setMemberEmailError('Please enter a valid email');
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

  // Validate form and create classroom
  const handleCreateClassroom = async () => {
    // Validate title
    if (!title.trim()) {
      setTitleError('Classroom title is required');
      return;
    }

    // Generate invite links if not already generated
    let adminLink = adminInviteLink;
    let memberLink = memberInviteLink;
    if (!adminInviteLink || !memberInviteLink) {
      const links = generateInviteLinks();
      adminLink = links.adminLink;
      memberLink = links.memberLink;
    }

    setIsLoading(true);
    
    try {
      // Here you would make your API call to create the classroom
      // const response = await createClassroomAPI({
      //   title,
      //   adminEmails,
      //   memberEmails,
      //   adminInviteLink: adminLink,
      //   memberInviteLink: memberLink,
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Success!',
        'Classroom created successfully!',
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
      {/* Replace your custom header with the Header component */}
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

        {/* Invite Admins Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite Admins</Text>
          
          {/* Invite via Link */}
          <View style={styles.linkSection}>
            <Text style={styles.subtitle}>Invite via Link:</Text>
            {adminInviteLink ? (
              <View style={styles.linkContainer}>
                <Text style={styles.linkText} numberOfLines={1}>
                  {adminInviteLink}
                </Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(adminInviteLink)}
                  disabled={isLoading}
                >
                  <Ionicons name="copy-outline" size={20} color="#1971c2" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.generateLinkButton}
                onPress={() => generateInviteLinks()}
                disabled={isLoading}
              >
                <Ionicons name="link-outline" size={20} color="#1971c2" />
                <Text style={styles.generateLinkText}>Generate Admin Invite Link</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Or Upload File */}
          <View style={styles.fileSection}>
            <Text style={styles.subtitle}>Or Upload File:</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handleFileUpload('admin')}
              disabled={isLoading}
            >
              <Ionicons name="document-outline" size={20} color="#1971c2" />
              <Text style={styles.uploadButtonText}>
                Upload CSV/Excel with Admin Emails
              </Text>
            </TouchableOpacity>
            <Text style={styles.fileHint}>
              Upload CSV or Excel file containing admin email addresses
            </Text>
          </View>

          {/* Or Add Manually */}
          <View style={styles.manualAddSection}>
            <Text style={styles.subtitle}>Or Add Manually:</Text>
            <View style={styles.emailInputContainer}>
              <TextInput
                style={[styles.emailInput, adminEmailError ? styles.inputError : null]}
                placeholder="Enter admin email"
                value={newAdminEmail}
                onChangeText={(text) => {
                  setNewAdminEmail(text);
                  if (adminEmailError) setAdminEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddAdminEmail}
                disabled={isLoading}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {adminEmailError ? <Text style={styles.errorText}>{adminEmailError}</Text> : null}
          </View>

          {/* Admin Email List */}
          {adminEmails.length > 0 && (
            <View style={styles.emailListSection}>
              <Text style={styles.emailListTitle}>Admin Emails ({adminEmails.length})</Text>
              <View style={styles.emailList}>
                {adminEmails.map((email, index) => (
                  <View key={index} style={styles.emailItem}>
                    <Text style={styles.emailText}>{email}</Text>
                    <TouchableOpacity
                      onPress={() => removeEmail(email, 'admin')}
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

        {/* Invite Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite Members</Text>
          
          {/* Invite via Link */}
          <View style={styles.linkSection}>
            <Text style={styles.subtitle}>Invite via Link:</Text>
            {memberInviteLink ? (
              <View style={styles.linkContainer}>
                <Text style={styles.linkText} numberOfLines={1}>
                  {memberInviteLink}
                </Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(memberInviteLink)}
                  disabled={isLoading}
                >
                  <Ionicons name="copy-outline" size={20} color="#1971c2" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.generateLinkButton}
                onPress={() => generateInviteLinks()}
                disabled={isLoading}
              >
                <Ionicons name="link-outline" size={20} color="#1971c2" />
                <Text style={styles.generateLinkText}>Generate Member Invite Link</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Or Upload File */}
          <View style={styles.fileSection}>
            <Text style={styles.subtitle}>Or Upload File:</Text>
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
              Upload CSV or Excel file containing member email addresses
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

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateClassroom}
          disabled={isLoading || !title.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.createButtonText}>Create Classroom</Text>
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
  linkSection: {
    marginBottom: 20,
  },
  generateLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbdefb',
    borderStyle: 'dashed',
  },
  generateLinkText: {
    marginLeft: 8,
    color: '#1971c2',
    fontWeight: '500',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  copyButton: {
    padding: 8,
    marginLeft: 8,
  },
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