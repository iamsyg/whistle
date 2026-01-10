// utils/phoneUtils.ts
// Enhanced version with better logging

import * as Crypto from 'expo-crypto';

/**
 * Normalize phone number to E.164 format
 * This MUST be consistent across all screens
 * 
 * @param phone - Phone number in any format
 * @param defaultCountryCode - Default country code to add if missing (e.g., '+91')
 * @returns E.164 formatted phone number (+XXXXXXXXXXX) or null if invalid
 */
export const normalizePhoneNumber = (
  phone: string, 
  defaultCountryCode: string = '+1'
): string | null => {
  try {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, try adding the default country code
    if (!cleaned.startsWith('+')) {
      // Remove leading 0 or 1 if present (common in some countries)
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.slice(1);
      }
      
      // Add the default country code
      cleaned = `${defaultCountryCode}${cleaned}`;
      //console.log(`📞 Added country code ${defaultCountryCode}: ${phone} → ${cleaned}`);
    } else {
      // Already has +, just log the processing
      //console.log(`📞 Already E.164 format: ${phone} → ${cleaned}`);
    }
    
    // Extract just the digits after +
    const digits = cleaned.slice(1);
    
    // E.164 format: + followed by 7-15 digits
    if (digits.length < 7 || digits.length > 15) {
      console.warn(`⚠️ Invalid E.164 phone length (${digits.length} digits): ${cleaned}`);
      return null;
    }
    
    // Ensure all remaining characters are digits
    if (!/^\d+$/.test(digits)) {
      console.warn('⚠️ Phone contains non-digit characters:', cleaned);
      return null;
    }
    
    return `+${digits}`;
  } catch (error) {
    console.error('❌ Error normalizing phone number:', error);
    return null;
  }
};

/**
 * Hash a phone number using SHA256
 * 
 * @param phoneNumber - E.164 formatted phone number
 * @returns SHA256 hash of the phone number
 */
export const hashPhoneNumber = async (phoneNumber: string): Promise<string> => {
  try {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      phoneNumber
    );
    return hash;
  } catch (error) {
    console.error('Error hashing phone number:', error);
    throw error;
  }
};

/**
 * Test if two phone numbers are the same after normalization
 * Useful for debugging
 */
export const comparePhoneNumbers = (
  phone1: string, 
  phone2: string,
  defaultCountryCode: string = '+1'
): boolean => {
  const normalized1 = normalizePhoneNumber(phone1, defaultCountryCode);
  const normalized2 = normalizePhoneNumber(phone2, defaultCountryCode);
  
  if (!normalized1 || !normalized2) {
    return false;
  }
  
  return normalized1 === normalized2;
};

/**
 * Debug utility to log phone normalization and hashing
 */
export const debugPhoneNumber = async (
  phone: string, 
  label: string = 'Phone',
  defaultCountryCode: string = '+1'
) => {
  //console.log(`\n========== ${label} DEBUG ==========`);
  //console.log('Original:', phone);
  
  const normalized = normalizePhoneNumber(phone, defaultCountryCode);
  //console.log('Normalized:', normalized);
  
  if (normalized) {
    const hash = await hashPhoneNumber(normalized);
    console.log('Hash:', hash);
  } else {
    console.log('Hash: N/A (invalid phone number)');
  }
  
  console.log('=====================================\n');
};

/**
 * Additional debugging: Find a specific phone number in a list
 * Useful for tracking down why a number isn't matching
 */
export const findPhoneInList = (
  searchPhone: string,
  phoneList: string[],
  defaultCountryCode: string = '+1'
): { found: boolean; normalizedSearch: string | null; matches: string[] } => {
  const normalizedSearch = normalizePhoneNumber(searchPhone, defaultCountryCode);
  
  if (!normalizedSearch) {
    return { found: false, normalizedSearch: null, matches: [] };
  }
  
  const matches = phoneList.filter(phone => {
    const normalized = normalizePhoneNumber(phone, defaultCountryCode);
    return normalized === normalizedSearch;
  });
  
  return {
    found: matches.length > 0,
    normalizedSearch,
    matches
  };
};