// frontend/app/(screens)/joinClassroom.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MessagingHeader from '@/components/MessagingHeader';
import { useJoinClassroom } from '@/hooks/useJoinClassroom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';

const JoinClassroom = () => {
  // State for classroom code
  const [classroomCode, setClassroomCode] = useState('');

  // State for join method dropdown
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'username' | 'phone'>('email');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownRef = useRef<View>(null);

  // State for QR Scanner
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  // Request camera permissions
  const [permission, requestPermission] = useCameraPermissions();

  const selectedEmail = useSelector(
    (state: RootState) => state.emailAuth.selectedEmail
  )

  const joinPayload = {
    class_code: classroomCode,
    join_via: selectedMethod,
    selected_email:
      selectedMethod === "email" ? selectedEmail || undefined : undefined,
  };

  const { joinClassroom, loading: isLoading } = useJoinClassroom(joinPayload);

  // Check camera permissions on mount
  useEffect(() => {
    const getCameraPermission = async () => {
      if (permission) {
        setHasPermission(permission.granted);
      }
    };

    getCameraPermission();
  }, [permission]);

  // Get method label
  const getMethodLabel = () => {
    switch (selectedMethod) {
      case 'email':
        return 'Email';
      case 'username':
        return 'Username';
      case 'phone':
        return 'Phone';
      default:
        return 'Email';
    }
  };

  // Handle join classroom with code
  const handleJoinWithCode = async () => {
    if (!classroomCode.trim()) {
      Alert.alert("Error", "Please enter a classroom code");
      return;
    }

    const res = await joinClassroom();

    if (!res) {
      Alert.alert("Error", "Something went wrong");
      return;
    }

    if ("error" in res) {
      const msg = res.error;

      if (msg.includes("requires email")) {
        Alert.alert(
          "Email Required",
          "This classroom only allows joining via verified email."
        );
      } else if (msg.includes("Email join is disabled")) {
        Alert.alert(
          "Email Not Allowed",
          "This classroom does not allow joining via email."
        );
      } else if (msg.includes("Invalid or unverified email")) {
        Alert.alert(
          "Invalid Email",
          "Please select a verified email to join."
        );
      } else if (msg.includes("domain not allowed")) {
        Alert.alert(
          "Domain Restricted",
          "Your email domain is not allowed for this classroom."
        );
      } else if (msg.includes("Phone number not verified")) {
        Alert.alert(
          "Phone Not Verified",
          "Please verify your phone number before joining."
        );
      } else if (msg.includes("Username not set")) {
        Alert.alert(
          "Username Required",
          "Please set a username in your profile to join."
        );
      } else {
        Alert.alert("Join Failed", msg);
      }

      return;
    }

    // ✅ SUCCESS STATES
    if (res.status === "joined") {
      Alert.alert("Success", "You have successfully joined the classroom!");
      setClassroomCode("");
    } else if (res.status === "pending") {
      Alert.alert("Pending Approval", "Your join request is pending admin approval.");
    } else if (res.status === "already_joined") {
      Alert.alert("Already Joined", "You are already a member of this classroom.");
    }
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
      // In a real app, you would use a QR code scanning library here
      // For now, we'll simulate extraction
      Alert.alert(
        'Image Selected',
        'QR code scanning from images would require additional setup with a QR code library.',
        [
          {
            text: 'OK',
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

  // Close dropdown when tapping outside
  const handleOutsideClick = () => {
    setDropdownVisible(false);
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
    <TouchableWithoutFeedback onPress={handleOutsideClick}>
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

        {/* Method Selector Header */}
        <View style={styles.methodHeader}>
          <Text style={styles.methodTitle}>Join using:</Text>
          <View ref={dropdownRef}>
            <TouchableOpacity
              style={[styles.selectedMethod, isLoading && styles.disabledText]}
              onPress={() => !isLoading && setDropdownVisible(!dropdownVisible)}
            >
              <Text style={styles.selectedMethodText}>{getMethodLabel()} ⌄</Text>
            </TouchableOpacity>

            {dropdownVisible && (
              <View style={styles.dropdown}>
                {['email', 'username', 'phone'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.dropdownItem,
                      selectedMethod === method && styles.dropdownItemActive
                    ]}
                    onPress={() => {
                      setSelectedMethod(method as 'email' | 'username' | 'phone');
                      setDropdownVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      selectedMethod === method && styles.dropdownItemTextActive
                    ]}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

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

            <TouchableOpacity
              style={styles.scanButton}
              onPress={startQRScanner}
              disabled={isLoading}
            >
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
            <TouchableOpacity
              style={[styles.galleryOption, isLoading && styles.disabledButton]}
              onPress={handlePickImage}
              disabled={isLoading}
            >
              <MaterialIcons name="photo-library" size={22} color="#666" />
              <Text style={styles.galleryOptionText}>Scan QR code from gallery</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* QR Scanner Modal */}
        {renderQRScanner()}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Method Selector Header - Updated to match your example
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  methodTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedMethod: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  selectedMethodText: {
    fontSize: 14,
    color: '#1971c2',
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },
  dropdown: {
    position: 'absolute',
    top: 35, // Position below the selected method text
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingVertical: 8,
    width: 180, // Increased width
    minWidth: 180, // Ensure minimum width
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 20, // Increased padding
  },
  dropdownItemActive: {
    backgroundColor: '#f0f7ff',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextActive: {
    color: '#1971c2',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  // Main Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 10,
    paddingBottom: 30,
  },
  // Input Section
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
    opacity: 0.7,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Divider
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
  // QR Section
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
  // QR Scanner Modal
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