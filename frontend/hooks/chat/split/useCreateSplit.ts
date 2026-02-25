// frontend/hooks/chat/split/useCreateSplit.ts

// Optimistic UI:

import { useState } from "react";
import { useDispatch } from "react-redux";
import { addMessage, removeMessage } from "@/store/slices/message/conversationSlice";   // removeMessage is in the same slice
import { upsertSplitDetails, removeSplitDetails } from "@/store/slices/chat/split/splitDetailsSlice";
import { supabase } from "@/utils/supabase";
import { SplitDetails, SplitMember } from "@/types/chat/split/splitDetails";
import { BaseBackendMessage } from "@/types/backend/baseMessage";

interface CreateSplitParams {
    title: string | null;
    total_amount: number;
    currency: string;
    split_type: "equally" | "unequally";
    members: { user_id: string; amount_owed: number }[];
    paid_by: string;
}

export function useCreateSplit(chat_id: string) {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const createSplit = async (params: CreateSplitParams) => {
        setLoading(true);

        // 1. Build optimistic IDs 
        const tempMsgId = `temp-msg-${Date.now()}`;
        const tempSplitId = `temp-split-${Date.now()}`;
        const now = new Date().toISOString();

        // 2. Build optimistic split entity 
        const optimisticMembers: SplitMember[] = params.members.map(m => ({
            user_id: m.user_id,
            is_payer: m.user_id === params.paid_by,
            amount_owed: m.amount_owed,
            status: m.user_id === params.paid_by ? 'paid' : 'pending',
            paid_at: m.user_id === params.paid_by ? now : null,
            can_pay: m.user_id !== params.paid_by,
            name: null,    // profile data not available here; server response will have it
            username: null,
            avatar_url: null,
        }));

        const optimisticSplit: SplitDetails = {
            id: tempSplitId,
            chat_id,
            message_id: tempMsgId,
            created_by: params.paid_by,   // best guess; server sets the real value
            paid_by: params.paid_by,
            title: params.title,
            total_amount: params.total_amount,
            currency: params.currency,
            split_type: params.split_type,
            status: 'pending',
            created_at: now,
            updated_at: null,
            settled_at: null,
            creator: { id: params.paid_by, name: null, username: null, avatar_url: null },
            members: optimisticMembers,
        };

        // 3. Build optimistic message 
        const optimisticMsg: BaseBackendMessage<'system'> = {
            id: tempMsgId,
            chat_id,
            sender_id: params.paid_by,
            content: null,
            message_type: 'system',
            metadata: {
                type: 'split',
                payload: { entity: 'split', entity_id: tempSplitId, action: 'created' },
            },
            reply_to_id: null,
            created_at: now,
            edited_at: null,
            deleted_at: null,
            sender: null,
            entities: { splits: [optimisticSplit] },
        };

        // 4. Dispatch optimistically 
        dispatch(addMessage({ chat_id, message: optimisticMsg }));
        dispatch(upsertSplitDetails(optimisticSplit));

        try {
            // 5. Get auth token 
            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;
            if (!token) throw new Error("Authentication expired");

            // 6. Call API
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/split/create/${chat_id}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(params),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || result.message || "Failed to create split");
            }

            // ── 7. Replace optimistic entries with real server data ────────────────
            // Remove temp message and temp split
            dispatch(removeMessage({ chat_id, messageId: tempMsgId }));
            dispatch(removeSplitDetails({ splitId: tempSplitId, chatId: chat_id }));

            // Add the real message and split from the server
            dispatch(addMessage({ chat_id, message: result }));

            const realSplit: SplitDetails | undefined = result?.entities?.splits?.[0];
            
            if (realSplit) {
                dispatch(upsertSplitDetails(realSplit));
            }

            return result;

        } catch (err) {
            // 8. Revert optimistic update on failure 

            dispatch(removeMessage({ chat_id, messageId: tempMsgId }));
            dispatch(removeSplitDetails({ splitId: tempSplitId, chatId: chat_id }));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { createSplit, loading };
}