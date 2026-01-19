// / components/AuthBootstrap.tsx
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/utils/supabase';
import { setUserId, clearUser } from '@/store/slices/auth/profileSlice';
import type { RootState } from '@/store/store';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { router } from 'expo-router';

export default function AuthBootstrap() {
  const dispatch = useDispatch();
  const appState = useRef(AppState.currentState);
  const persistedUserId = useSelector((state: RootState) => state.profile.userId);
  const hasInitialized = useRef(false);
  const isInitialized = useRef(false);

  useEffect(() => {

    GoogleSignin.configure({
      webClientId: '1023753472474-o9k6afu73gs4fbe1btavsg076m2rnumr.apps.googleusercontent.com',
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);

        const sessionUserId = session?.user?.id;

        if (sessionUserId) {
          dispatch(setUserId(sessionUserId));
          // Only redirect to home if we are currently on an auth screen
          // This prevents kicking the user out of whatever screen they were on
          if (isInitialized.current === false) {
            router.replace('/(tabs)/Chats');
          }
        } else if (event === 'SIGNED_OUT' || (!sessionUserId && !isInitialized.current)) {
          dispatch(clearUser());
          router.replace('/(auth)/login');
        }

        isInitialized.current = true;

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      }
    );

  }, [dispatch]);

  useEffect(() => {
    // Initial session check - wait for persist rehydration
    const initializeAuth = async () => {
      if (hasInitialized.current) return;
      hasInitialized.current = true;

      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session restore error:', error);
          if (persistedUserId) {
            dispatch(clearUser());
          }
          return;
        }

        const sessionUserId = data?.session?.user?.id;

        if (sessionUserId && sessionUserId !== persistedUserId) {
          dispatch(setUserId(sessionUserId));
          router.replace('/(tabs)/Chats');
        } else if (!sessionUserId && persistedUserId) {
          dispatch(clearUser());
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      }
    };

    // Small delay to ensure persist completes
    const initTimer = setTimeout(initializeAuth, 100);

    // Auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event);

        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            if (session?.user?.id) {
              dispatch(setUserId(session.user.id));
            }
            break;
          case 'SIGNED_OUT':
            dispatch(clearUser());
            break;
        }
      }
    );

    // Validate session when app comes to foreground
    const appStateSubscription = AppState.addEventListener(
      'change',
      async (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          const { data } = await supabase.auth.getSession();
          if (!data?.session && persistedUserId) {
            dispatch(clearUser());
          }
        }
        appState.current = nextAppState;
      }
    );

    // Periodic session validation (every 5 minutes)
    const validateSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session && persistedUserId) {
        dispatch(clearUser());
      }
    };

    const validationInterval = setInterval(validateSession, 5 * 60 * 1000);

    return () => {
      clearTimeout(initTimer);
      authListener?.subscription?.unsubscribe();
      appStateSubscription.remove();
      // clearInterval(validationInterval);
    };
  }, [dispatch]);

  return null;
}