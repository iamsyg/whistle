// frontend/hooks/useSyncDeviceContacts.ts

import { useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Contacts from 'expo-contacts';
import { useDispatch, useSelector } from 'react-redux';

import { requestContactsPermission } from '@/utils/requestContactsPermission';
import { normalizePhoneNumber, hashPhoneNumber, debugPhoneNumber } from '@/utils/phoneUtils';
import { getDeviceCountryDialCode } from '@/utils/countryCode';
import { setContacts, setContactsLoading } from '@/store/slices/contacts/contactsSlice';
import { RootState } from '@/store/store';
import { Contact, MatchedContact } from '@/types/contact';
import { useSyncContact } from '@/hooks/useSyncContact';

export const useSyncDeviceContacts = () => {
  const dispatch = useDispatch();
  const contacts = useSelector((state: RootState) => state.contacts.all);

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const avatarColors = useMemo(() => [
    '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0',
    '#118AB2', '#EF476F', '#073B4C', '#7209B7'
  ], []);

  const syncDeviceContacts = useCallback(async () => {
    if (!permissionGranted) {
      const granted = await requestContactsPermission();
      if (!granted) return;
      setPermissionGranted(true);
    }

    setLoading(true);
    setSyncing(true);
    dispatch(setContactsLoading(true));

    try {
      const defaultCountryCode = getDeviceCountryDialCode();
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (!data.length) {
        Alert.alert('No Contacts', 'No contacts found with phone numbers.');
        return;
      }

      const processed: Contact[] = [];

      for (const contact of data) {
        for (const phone of contact.phoneNumbers ?? []) {
          if (!phone.number) continue;

          const normalized = normalizePhoneNumber(phone.number, defaultCountryCode);
          if (!normalized) continue;

          if (processed.length === 0) {
            await debugPhoneNumber(phone.number, 'First Contact', defaultCountryCode);
          }

          const hash = await hashPhoneNumber(normalized);
          processed.push({
            contactId: `${contact.id}-${hash}`,
            name: contact.name ?? 'Unknown',
            phone: normalized,
            hash,
            isRegistered: false,
            isSelected: false,
            avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)],
          });
        }
      }

      const uniqueContacts = processed.filter(
        (c, i, self) => i === self.findIndex(x => x.hash === c.hash)
      );

      const backend = await useSyncContact(uniqueContacts.map(c => c.hash));
      if (!backend?.success) {
        dispatch(setContacts(uniqueContacts));
        return;
      }

      const matched = new Map(
        (backend.data.matched_contacts as MatchedContact[])
          .map(u => [u.phone_number_hash, u.id])
      );

      const finalContacts = uniqueContacts.map(c => ({
        ...c,
        isRegistered: matched.has(c.hash),
        profileId: matched.get(c.hash),
      }));

      dispatch(setContacts(finalContacts));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to sync contacts');
    } finally {
      setLoading(false);
      setSyncing(false);
      dispatch(setContactsLoading(false));
    }
  }, [permissionGranted, dispatch, avatarColors]);

  return {
    syncDeviceContacts,
    loading,
    syncing,
    contacts,
  };
};
