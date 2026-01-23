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
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';
import { createClassroom } from '@/services/conversation/createClassroom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { upsertClassroom } from '@/store/slices/classroom/classroomSlice';

export default function CreateClassroom() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState('');

  // Email mode toggle
  const [requireEmail, setRequireEmail] = useState(true);

  // Student chat permission
  const [allowStudentChat, setAllowStudentChat] = useState(true);

  const dispatch = useDispatch();

  const selectedEmail = useSelector(
    (state: RootState) => state.emailAuth.selectedEmail
  );

  // Validate form and create classroom
  const handleCreateClassroom = async () => {
    // Validate title
    if (!title.trim()) {
      setTitleError('Base title is required');
      return;
    }

    setIsLoading(true);

    try {

      if (!selectedEmail) {
        Alert.alert(
          'Email required',
          'Please select an email before creating a base.'
        );
        return;
      }

      const classroom = await createClassroom(title, description || null, requireEmail, allowStudentChat, selectedEmail);

      console.log('Created classroom:', classroom);

      dispatch(upsertClassroom(classroom));


      Alert.alert(
        'Success!',
        `Base "${title}" created successfully!\n\n` +
        `${description ? `Description: ${description}\n\n` : ''}` +
        `• ${requireEmail ? 'Email mode: ON (Participants join via email)' : 'Email mode: OFF (Participants can join via username/phone)'}\n` +
        `• Chat: ${allowStudentChat ? 'ENABLED (Everyone can send messages)' : 'DISABLED (Messages are restricted)'}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          }
        ]
      );

    } catch (error) {
      Alert.alert('Error', 'Failed to create base. Please try again.');
      console.error('Create base error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Create Base"
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
        ]}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Base Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Base Title *</Text>
          <TextInput
            style={[styles.input, titleError ? styles.inputError : null]}
            placeholder="Enter base title"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (titleError) setTitleError('');
            }}
            editable={!isLoading}
            maxLength={100}
          />
          {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
          <Text style={styles.charCount}>{title.length}/100 characters</Text>
        </View>

        {/* Base Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe what this base is about..."
            value={description}
            onChangeText={setDescription}
            editable={!isLoading}
            maxLength={500}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/500 characters</Text>
          <Text style={styles.hintText}>
            A good description helps participants understand the purpose of this base
          </Text>
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

        {/* Chat Permission */}
        <View style={styles.section}>
          <View style={styles.toggleContainer}>
            <View style={styles.toggleLabelContainer}>
              <Ionicons name="chatbubbles-outline" size={20} color="#1971c2" />
              <Text style={styles.sectionTitle}>Allow Chat</Text>
            </View>
            <Switch
              value={allowStudentChat}
              onValueChange={setAllowStudentChat}
              trackColor={{ false: '#ddd', true: '#bbdefb' }}
              thumbColor={allowStudentChat ? '#1971c2' : '#f4f3f4'}
              disabled={isLoading}
            />
          </View>
          <Text style={styles.toggleDescription}>
            {allowStudentChat
              ? 'Everyone can send messages in the base'
              : 'Messages are restricted'}
          </Text>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, (isLoading || !title.trim()) && styles.createButtonDisabled]}
          onPress={handleCreateClassroom}
          disabled={isLoading || !title.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.createButtonContent}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Base</Text>
            </View>
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
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
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1971c2',
    marginBottom: 16,
  },
  summaryItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  descriptionSummary: {
    fontWeight: '400',
    lineHeight: 20,
    color: '#555',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusActive: {
    color: '#2e7d32',
  },
  statusInactive: {
    color: '#d32f2f',
  },
  summaryHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryHintText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontStyle: 'italic',
    flex: 1,
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
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});