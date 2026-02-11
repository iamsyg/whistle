// frontend/utils/downloadMediaToDevice.ts

import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { FrontendMessage } from '@/types/frontend/message';

export async function downloadMediaToDevice(
  message?: FrontendMessage
) {
  try {
    const originalName = message?.metadata?.original_name;
    const mime = message?.metadata?.mime_type;
    const url = message?.metadata?.url;

    if (!url) {
      Alert.alert('No media URL found');
      return;
    }

    const extension =
      originalName?.split('.').pop() ||
      mime?.split('/')[1] ||
      'dat';

    const fileName = `${message?.id}.${extension}`;

    const file = new File(Paths.document, fileName);

    // 🔍 Check if already downloaded
    if (file.exists) {
      Alert.alert(
        'Already Downloaded',
        'This file already exists on your device.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open',
            onPress: async () => {
              await Sharing.shareAsync(file.uri);
            }
          }
        ]
      );
      return;
    }

    // ⬇️ Download file
    await File.downloadFileAsync(url, file);

    const category =
      mime?.startsWith('image/')
        ? 'image'
        : mime?.startsWith('video/')
        ? 'video'
        : 'document';

    if (category === 'image' || category === 'video') {
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission required to save media');
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(file.uri);

      const album = await MediaLibrary.getAlbumAsync('Whistle');

      if (!album) {
        await MediaLibrary.createAlbumAsync('Whistle', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert('Saved to gallery');
    } else {
      // Documents
      await Sharing.shareAsync(file.uri);
    }

  } catch (error: any) {
    console.error('Download error:', error);
    Alert.alert('Download failed', error.message);
  }
}

