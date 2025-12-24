export interface CountryCode {
  name: string;
  dial_code: string;
  code: string;
  flag: string;
}

export const countryCodes: CountryCode[] = [
  { name: 'India', dial_code: '+91', code: 'IN', flag: '🇮🇳' },
  { name: 'United States', dial_code: '+1', code: 'US', flag: '🇺🇸' },
  { name: 'United Kingdom', dial_code: '+44', code: 'GB', flag: '🇬🇧' },
  { name: 'Canada', dial_code: '+1', code: 'CA', flag: '🇨🇦' },
  { name: 'Australia', dial_code: '+61', code: 'AU', flag: '🇦🇺' },
  { name: 'Germany', dial_code: '+49', code: 'DE', flag: '🇩🇪' },
  { name: 'France', dial_code: '+33', code: 'FR', flag: '🇫🇷' },
  { name: 'Japan', dial_code: '+81', code: 'JP', flag: '🇯🇵' },
  { name: 'China', dial_code: '+86', code: 'CN', flag: '🇨🇳' },
  { name: 'Brazil', dial_code: '+55', code: 'BR', flag: '🇧🇷' },
];

export const getDefaultCountryCode = (): CountryCode => {
  return countryCodes[0]; // India (+91) as default
};