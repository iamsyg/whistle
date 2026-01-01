// utils/countryCode.ts
// Get the device's country code to use as default for phone normalization

import * as Localization from 'expo-localization';

// Map of country ISO codes to dial codes
const COUNTRY_DIAL_CODES: { [key: string]: string } = {
  'US': '+1',
  'CA': '+1',
  'IN': '+91',
  'GB': '+44',
  'AU': '+61',
  'DE': '+49',
  'FR': '+33',
  'IT': '+39',
  'ES': '+34',
  'BR': '+55',
  'MX': '+52',
  'JP': '+81',
  'CN': '+86',
  'KR': '+82',
  'RU': '+7',
  'SA': '+966',
  'AE': '+971',
  'SG': '+65',
  'MY': '+60',
  'TH': '+66',
  'PH': '+63',
  'ID': '+62',
  'VN': '+84',
  'PK': '+92',
  'BD': '+880',
  'NG': '+234',
  'EG': '+20',
  'ZA': '+27',
  'AR': '+54',
  'CL': '+56',
  'CO': '+57',
  'PE': '+51',
  'NZ': '+64',
  'IE': '+353',
  'PT': '+351',
  'GR': '+30',
  'PL': '+48',
  'TR': '+90',
  'IL': '+972',
  'SE': '+46',
  'NO': '+47',
  'DK': '+45',
  'FI': '+358',
  'NL': '+31',
  'BE': '+32',
  'CH': '+41',
  'AT': '+43',
  // Add more as needed
};

/**
 * Get the device's country dial code based on locale
 * @returns Country dial code (e.g., '+91', '+1') or '+1' as fallback
 */
export const getDeviceCountryDialCode = (): string => {
  try {
    const locales = Localization.getLocales();
    
    if (locales && locales.length > 0) {
      const regionCode = locales[0].regionCode;
      
      if (regionCode && COUNTRY_DIAL_CODES[regionCode]) {
        console.log(`Device region: ${regionCode}, Dial code: ${COUNTRY_DIAL_CODES[regionCode]}`);
        return COUNTRY_DIAL_CODES[regionCode];
      }
    }
    
    console.log('Could not determine device country, using +1 as default');
    return '+1'; // Default to US/Canada
  } catch (error) {
    console.error('Error getting device country code:', error);
    return '+1';
  }
};

/**
 * Get the user's region code (ISO 3166-1 alpha-2)
 * @returns Region code (e.g., 'IN', 'US') or 'US' as fallback
 */
export const getDeviceRegionCode = (): string => {
  try {
    const locales = Localization.getLocales();
    
    if (locales && locales.length > 0 && locales[0].regionCode) {
      return locales[0].regionCode;
    }
    
    return 'US';
  } catch (error) {
    console.error('Error getting device region code:', error);
    return 'US';
  }
};