// frontend/components/AuthBootstrap.tsx

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '@/utils/supabase';
import { setUserId } from '@/store/slices/auth/profileSlice';

export default function AuthBootstrap() {
  const dispatch = useDispatch();

  useEffect(() => {
    const restoreSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data?.session?.user?.id) {
        dispatch(setUserId(data.session.user.id));
      }
    };

    restoreSession();
  }, []);

  return null;
}
