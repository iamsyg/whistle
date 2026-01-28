// frontend/app/(screens)/joinClassroom.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MessagingHeader from '@/components/MessagingHeader';

const JoinClassroom = () => {
  // State for classroom code
  const [classroomCode, setClassroomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for QR Scanner
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  
  // State for Image Picker (for scanning QR from gallery)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Request camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  
  // Check camera permissions on mount
  useEffect(() => {
    const getCameraPermission = async () => {
      if (permission) {
        setHasPermission(permission.granted);
      }
    };
    
    getCameraPermission();
  }, [permission]);

  // Handle join classroom with code
  const handleJoinWithCode = async () => {
    if (!classroomCode.trim()) {
      Alert.alert('Error', 'Please enter a classroom code');
      return;
    }
    
    if (classroomCode.trim().length < 3) {
      Alert.alert('Error', 'Classroom code must be at least 3 characters');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Join Request Sent',
        `Request to join classroom with code "${classroomCode}" has been sent to the admin.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // In a real app, you might navigate to a pending approval screen
              setClassroomCode('');
            }
          }
        ]
      );
    }, 1500);
  };

  // Handle QR code scan
  const handleQRScan = ({ data }: { data: string }) => {
    setScanned(true);
    
    // Parse QR code data (could be a URL or direct code)
    let code = data;
    
    // If it's a URL, try to extract the code from it
    if (data.includes('classroom.example.com/join/')) {
      const match = data.match(/join\/([A-Za-z0-9]+)/);
      if (match && match[1]) {
        code = match[1];
      }
    }
    
    // Close scanner and set the code
    setShowScanner(false);
    setClassroomCode(code);
    
    Alert.alert(
      'QR Code Scanned',
      `Classroom code "${code}" has been detected.`,
      [
        {
          text: 'Join Now',
          onPress: () => {
            setClassroomCode(code);
            handleJoinWithCode();
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  // Open image picker to scan QR from gallery
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access photo library is required!');
      return;
    }
    
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    
    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setSelectedImage(pickerResult.assets[0].uri);
      
      // In a real app, you would use a QR code scanning library here
      // For now, we'll simulate extraction
      Alert.alert(
        'Image Selected',
        'QR code scanning from images would require additional setup with a QR code library.',
        [
          {
            text: 'OK',
            onPress: () => setSelectedImage(null)
          }
        ]
      );
    }
  };

  // Request camera permission
  const requestCameraPermission = async () => {
    const { granted } = await requestPermission();
    setHasPermission(granted);
    
    if (!granted) {
      Alert.alert('Camera Permission Denied', 'You need to grant camera permission to use the QR scanner.');
    } else {
      setShowScanner(true);
    }
  };

  // Start QR scanner
  const startQRScanner = () => {
    if (hasPermission === null) {
      requestCameraPermission();
    } else if (hasPermission === false) {
      Alert.alert(
        'Camera Access Required',
        'Camera access is required to scan QR codes. Would you like to enable it in settings?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Open Settings',
            onPress: () => {
              // In a real app, you might want to open app settings
              Alert.alert('Settings', 'Please enable camera permissions in your device settings.');
            }
          }
        ]
      );
    } else {
      setShowScanner(true);
    }
  };

  // Close QR scanner
  const closeQRScanner = () => {
    setShowScanner(false);
    setScanned(false);
  };

  // Render QR Scanner
  const renderQRScanner = () => {
    if (!showScanner) return null;

    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleQRScan}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={closeQRScanner}>
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.scannerTitle}>Scan QR Code</Text>
              <View style={{ width: 30 }} /> {/* Spacer for alignment */}
            </View>
            
            <View style={styles.scannerFrame}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
            
            <Text style={styles.scannerInstruction}>
              Align the QR code within the frame
            </Text>
            
            <View style={styles.scannerButtons}>
              <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
                <MaterialIcons name="photo-library" size={24} color="#fff" />
                <Text style={styles.galleryButtonText}>Gallery</Text>
              </TouchableOpacity>
              
              {scanned && (
                <TouchableOpacity style={styles.scanAgainButton} onPress={() => setScanned(false)}>
                  <Text style={styles.scanAgainButtonText}>Tap to Scan Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </CameraView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header - This has SafeAreaView built in */}
      <MessagingHeader
        title="Join Classroom"
        subtitle="Enter code or scan QR"
        showBackButton={true}
        showSearch={false}
        showCall={false}
        showMenu={false}
        isDarkMode={false}
      />

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        

        {/* Classroom Code Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Classroom Code</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="class" size={24} color="#4A90E2" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter classroom code (e.g., MATH2024)"
              placeholderTextColor="#999"
              value={classroomCode}
              onChangeText={setClassroomCode}
              autoCapitalize="characters"
              maxLength={20}
              editable={!isLoading}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.joinButton, isLoading && styles.joinButtonDisabled]}
            onPress={handleJoinWithCode}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="enter-outline" size={22} color="#fff" />
                <Text style={styles.joinButtonText}>Join Classroom</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* QR Scanner Section */}
        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>Scan QR Code</Text>
          <Text style={styles.qrDescription}>
            Scan the QR code provided by your instructor to join instantly
          </Text>
          
          <TouchableOpacity style={styles.scanButton} onPress={startQRScanner}>
            <View style={styles.qrCodePreview}>
              <View style={styles.qrPattern}>
                <View style={[styles.qrCorner, { top: 0, left: 0 }]} />
                <View style={[styles.qrCorner, { top: 0, right: 0 }]} />
                <View style={[styles.qrCorner, { bottom: 0, left: 0 }]} />
                <View style={[styles.qrCorner, { bottom: 0, right: 0 }]} />
                <View style={styles.qrCenter} />
              </View>
            </View>
            <View style={styles.scanButtonContent}>
              <Ionicons name="qr-code-outline" size={28} color="#4A90E2" />
              <Text style={styles.scanButtonText}>Open QR Scanner</Text>
              <Text style={styles.scanButtonSubtext}>Tap to scan classroom QR code</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          {/* Alternative gallery option */}
          <TouchableOpacity style={styles.galleryOption} onPress={handlePickImage}>
            <MaterialIcons name="photo-library" size={22} color="#666" />
            <Text style={styles.galleryOptionText}>Scan QR code from gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>How to Join:</Text>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Get the classroom code or QR code from your instructor
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              Enter the code above or scan the QR code
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              Wait for admin approval to access the classroom
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* QR Scanner Modal */}
      {renderQRScanner()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 10, // This creates space below the header
    paddingBottom: 30,
  },
  welcomeSection: {
    alignItems: 'center',
    padding: 25,
    height: 140,
    backgroundColor: '#fff',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  welcomeImage: {
    width: 120,
    height: 1,
    borderRadius: 60,
    marginBottom: 15,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 10,
    gap: 10,
  },
  joinButtonDisabled: {
    backgroundColor: '#A0C8FF',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontWeight: '600',
  },
  qrSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 15,
  },
  qrCodePreview: {
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  qrPattern: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  qrCorner: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#333',
  },
  qrCenter: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#333',
    top: 17,
    left: 17,
  },
  scanButtonContent: {
    flex: 1,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scanButtonSubtext: {
    fontSize: 12,
    color: '#666',
  },
  galleryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    justifyContent: 'center',
    gap: 10,
  },
  galleryOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  instructionsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  scannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1000,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    marginTop: 50,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#4A90E2',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#4A90E2',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#4A90E2',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#4A90E2',
  },
  scannerInstruction: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
  },
  scannerButtons: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
    gap: 10,
  },
  galleryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  scanAgainButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  scanAgainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default JoinClassroom;