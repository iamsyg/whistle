import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { CountryCode, countryCodes, getDefaultCountryCode } from '../constants/countryCodes';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onCountryCodeChange?: (countryCode: CountryCode) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  onCountryCodeChange,
  placeholder = 'Phone number',
  error,
  disabled = false,
  autoFocus = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(getDefaultCountryCode());
  const [modalVisible, setModalVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setModalVisible(false);
    onCountryCodeChange?.(country);
    inputRef.current?.focus();
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    onChangeText(cleaned);
  };

  const renderCountryItem = ({ item }: { item: CountryCode }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item)}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.dialCode}>{item.dial_code}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={[styles.container, error && styles.containerError]}>
        <TouchableOpacity
          style={styles.countryCodeButton}
          onPress={() => setModalVisible(true)}
          disabled={disabled}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={styles.countryCodeText}>{selectedCountry.dial_code}</Text>
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={formatPhoneNumber}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          editable={!disabled}
          autoFocus={autoFocus}
          maxLength={15}
        />
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Country</Text>
                <FlatList
                  data={countryCodes}
                  renderItem={renderCountryItem}
                  keyExtractor={(item) => item.code}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    height: 56,
  },
  containerError: {
    borderColor: '#ff6b6b',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  flag: {
    fontSize: 24,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#ddd',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    height: '100%',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  dialCode: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default PhoneInput;