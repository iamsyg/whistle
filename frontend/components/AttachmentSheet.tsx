// frontend/components/AttachmentSheet.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import ModalMenu from './ModalMenu';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

import * as Linking from 'expo-linking';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AttachmentSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
  onMediaSelected?: (media: any) => void; // New prop for handling selected media
  isDarkMode?: boolean;
}

interface MediaAsset {
  uri: string;
  type: 'image' | 'video';
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number; // for videos
}


const AttachmentSheet: React.FC<AttachmentSheetProps> = ({
  visible,
  onClose,
  onSelect,
  onMediaSelected,
  isDarkMode = false,
}) => {

  const [mediaPermission, setMediaPermission] = useState(false);

  // Request media library permissions
  useEffect(() => {
    (async () => {
      if (visible) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setMediaPermission(status === 'granted');
      }
    })();
  }, [visible]);

  // const handleGalleryPress = () => onSelect('gallery');
  // const handleCameraPress = () => onSelect('camera');

  const handleGalleryPress = async () => {
    // Close the sheet first
    onClose();
    
    // Check permissions
    if (!mediaPermission) {
      Alert.alert(
        'Permission Required',
        'Please grant media library permissions to access your gallery.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Open Settings',
            onPress: () => {
              // You might want to link to app settings
              Linking.openSettings();
            },
          },
        ]
      );
      return;
    }

    try {
      // Open image picker for both images and videos
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allows both images and videos
        allowsMultipleSelection: true, // Allow multiple selection
        quality: 0.8, // Compress images
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
        allowsEditing: false, // Set to true if you want to allow editing
        exif: false, // Don't include EXIF data
      });

      if (!result.canceled && result.assets.length > 0) {
        // Process selected media
        const selectedMedia: MediaAsset[] = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          fileName: asset.fileName || `Media_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height,
          duration: asset.duration || 0,
        }));

        // Pass media to parent component
        if (onMediaSelected) {
          onMediaSelected(selectedMedia);
        }

        // Also call the original onSelect callback if needed
        onSelect('gallery');
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media from gallery');
    }
  };

  const handleCameraPress = async () => {
    onClose();
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const media = result.assets[0];
        const mediaAsset: MediaAsset = {
          uri: media.uri,
          type: media.type === 'video' ? 'video' : 'image',
          fileName: media.fileName || `Camera_${Date.now()}.${media.type === 'video' ? 'mp4' : 'jpg'}`,
          fileSize: media.fileSize,
          width: media.width,
          height: media.height,
          duration: media.duration || 0,
        };

        if (onMediaSelected) {
          onMediaSelected([mediaAsset]);
        }
        onSelect('camera');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };
  const handleDocumentPress = () => onSelect('document');
  const handleContactPress = () => onSelect('contact');
  const handleLocationPress = () => onSelect('location');
  const handleTaskPress = () => onSelect('task');
  const handleSplitPress = () => onSelect('split');

  const attachmentOptions = [
    {
      id: 'gallery',
      label: 'Gallery',
      icon: 'image-outline',
      onPress: handleGalleryPress,
    },
    {
      id: 'camera',
      label: 'Camera',
      icon: 'camera-outline',
      onPress: handleCameraPress,
    },
    {
      id: 'document',
      label: 'Document',
      icon: 'document-outline',
      onPress: handleDocumentPress,
    },
    {
      id: 'contact',
      label: 'Contact',
      icon: 'person-outline',
      iconType: 'ionicons',
      description: 'Share a contact',
      onPress: handleContactPress,
    },
    {
      id: 'location',
      label: 'Location',
      icon: 'location-outline',
      iconType: 'ionicons',
      description: 'Share your location',
      onPress: handleLocationPress,
    },
    {
      id: 'task',
      label: 'Task',
      icon: 'checkbox-outline',
      iconType: 'ionicons',
      description: 'Assign a task',
      onPress: handleTaskPress,
    },
    {
      id: 'split',
      label: 'Split',
      icon: 'receipt-outline',
      iconType: 'ionicons',
      description: 'Create expense split',
      onPress: handleSplitPress,
    },
  ];

  const theme = {
    light: {
      background: '#FFFFFF',
      backdrop: 'rgba(0, 0, 0, 0.5)',
      text: '#000000',
      textSecondary: '#666666',
      border: '#E0E0E0',
      itemBackground: '#F8F9FA',
    },
    dark: {
      background: '#1F2C34',
      backdrop: 'rgba(0, 0, 0, 0.7)',
      text: '#FFFFFF',
      textSecondary: '#A0A0A0',
      border: '#2A3942',
      itemBackground: '#233138',
    },
  };

  const colors = isDarkMode ? theme.dark : theme.light;

  const renderIcon = (icon: string, iconType: string) => {
    if (iconType === 'ionicons') {
      return <Ionicons name={icon as any} size={28} color={isDarkMode ? '#00A884' : '#008069'} />;
    }
    return <MaterialIcons name={icon as any} size={28} color={isDarkMode ? '#00A884' : '#008069'} />;
  };

  return (

    <ModalMenu
      visible={visible}
      onClose={onClose}
      menuItems={attachmentOptions}
      menuWidth={SCREEN_WIDTH * 0.96}
    />
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  optionItem: {
    width: (SCREEN_WIDTH - 48) / 3,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  optionIcon: {
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 11,
    textAlign: 'center',
  },
  cancelButton: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AttachmentSheet;