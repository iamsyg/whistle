// frontend/utils/uploadMedia.ts

import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

export async function uploadMedia({
  uri,
  fileName,
  mimeType,
  chatId,
  conversationType,
}: {
  uri: string;
  fileName: string;
  mimeType: string;
  chatId: string;
  conversationType: string;
}) {

    try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;

        if (!token) throw new Error("AUTH_REQUIRED", { cause: new Error("No access token") });

        const formData = new FormData();

        formData.append('conversation_type', conversationType);
        formData.append('chat_id', chatId);

        formData.append(
            'file',
            {
                uri,
                name: fileName,
                type: mimeType || 'application/octet-stream',
            } as unknown as Blob
        );

        console.log("FormData prepared for upload:", formData);
        console.log("Uploading media with params:", {
            uri,
            fileName,
            mimeType,
            chatId,
            conversationType,
        }
        )

        const res = await fetch(
            `${process.env.EXPO_PUBLIC_BACKEND_URL}/media/upload`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            }
        );

        if (!res.ok) {
            const err = await res.text();
            throw new Error(err);
        }
        return res.json();

    } catch (err) {
        throw new Error("Error in uploadMedia", { cause: err });
    }
}
