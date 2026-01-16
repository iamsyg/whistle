// CreateGroupScreen.tsx
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createGroupChat } from '@/services/conversation/createGroup';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { addConversation, setConversation, setUserAllConversations } from '@/store/slices/message/conversationSlice';
import { router } from 'expo-router';
import { setContacts } from '@/store/slices/contacts/contactsSlice';

interface GroupData {
    title: string;
    description: string;
    imageUri: string | null;
}

const CreateGroupScreen: React.FC = () => {
    const [groupData, setGroupData] = useState<GroupData>({
        title: '',
        description: '',
        imageUri: null,
    });
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();

    const contacts = useSelector(
        (state: RootState) => state.contacts.all
    );

    const selectedContacts = useMemo(
        () => contacts.filter(c => c.isSelected),
        [contacts]
    );

    // Request permission and pick image from gallery
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
            setGroupData({ ...groupData, imageUri: result.assets[0].uri });
        }
    };

    // Take photo with camera
    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission required', 'Sorry, we need camera permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
            setGroupData({ ...groupData, imageUri: result.assets[0].uri });
        }
    };

    // Show options for image selection
    const showImageOptions = () => {
        Alert.alert(
            'Select Group Image',
            'Choose an option',
            [
                { text: 'Take Photo', onPress: takePhoto },
                { text: 'Choose from Gallery', onPress: pickImage },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    console.log("selected profile IDs", selectedContacts.map(c => c.profileId!));

    // Handle create group

    const handleCreateGroup = async () => {
        if (!groupData.title.trim()) {
            Alert.alert('Error', 'Group title is required');
            return;
        }

        try {
            setIsLoading(true);

            const result = await createGroupChat(
                groupData.title,
                selectedContacts.map(c => c.profileId!)
            );

            // ✅ Store group conversation in Redux
            dispatch(setConversation({
                conversationId: result.chat_id,
                type: 'group',
            }));
            
            dispatch(addConversation({
                chat_id: result.chat_id,
                type: 'group',
                title: groupData.title,
                last_message: null,
                last_message_at: new Date().toISOString(),
            }));

            dispatch(
                setContacts(contacts.map(c => ({ ...c, isSelected: false })))
            );

            // ✅ Navigate to chat screen
            router.replace('/(screens)/chatScreen');

        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to create group');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.header}>Create New Group</Text>

                {/* Image and Title Section */}
                <View style={styles.topSection}>
                    {/* Circular Image Upload */}
                    <TouchableOpacity
                        style={styles.imageContainer}
                        onPress={showImageOptions}
                        activeOpacity={0.7}
                    >
                        {groupData.imageUri ? (
                            <Image
                                source={{ uri: groupData.imageUri }}
                                style={styles.groupImage}
                            />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name="camera-outline" size={40} color="#666" />
                                <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                            </View>
                        )}
                        <View style={styles.editIconContainer}>
                            <Ionicons name="pencil" size={16} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    {/* Group Title Input */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.label}>Group Title *</Text>
                        <TextInput
                            style={styles.titleInput}
                            placeholder="Enter group title"
                            value={groupData.title}
                            onChangeText={(text) => setGroupData({ ...groupData, title: text })}
                            maxLength={50}
                        />
                        <Text style={styles.charCount}>{groupData.title.length}/50</Text>
                    </View>
                </View>

                {/* Description Section */}
                <View style={styles.descriptionContainer}>
                    <Text style={styles.label}>Description (Optional)</Text>
                    <TextInput
                        style={styles.descriptionInput}
                        placeholder="Describe your group..."
                        value={groupData.description}
                        onChangeText={(text) => setGroupData({ ...groupData, description: text })}
                        multiline
                        numberOfLines={4}
                        maxLength={200}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{groupData.description.length}/200</Text>
                </View>

                {/* Info Text */}
                <View style={styles.infoContainer}>
                    <Ionicons name="information-circle-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                        Group title is required. Image and description are optional but recommended.
                    </Text>
                </View>
            </ScrollView>

            {/* Create Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[
                        styles.createButton,
                        (!groupData.title.trim() || isLoading) && styles.createButtonDisabled
                    ]}
                    onPress={handleCreateGroup}
                    disabled={!groupData.title.trim() || isLoading}
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <Text style={styles.buttonText}>Creating...</Text>
                    ) : (
                        <Text style={styles.buttonText}>Create Group</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#333',
        textAlign: 'center',
    },
    topSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 30,
    },
    imageContainer: {
        marginRight: 20,
        position: 'relative',
    },
    groupImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#4a90e2',
    },
    imagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ccc',
        borderStyle: 'dashed',
    },
    imagePlaceholderText: {
        marginTop: 5,
        fontSize: 12,
        color: '#666',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4a90e2',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    titleContainer: {
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    titleInput: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    descriptionContainer: {
        marginBottom: 25,
    },
    descriptionInput: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
        minHeight: 120,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f4fd',
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
    },
    infoText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#2c3e50',
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
    },
    createButton: {
        backgroundColor: '#4a90e2',
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
        shadowColor: '#4a90e2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    createButtonDisabled: {
        backgroundColor: '#a0c4ff',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default CreateGroupScreen;