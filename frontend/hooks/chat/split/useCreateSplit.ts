// frontend/hooks/chat/split/useCreateSplit.ts

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addMessage, removeMessage } from "@/store/slices/message/conversationSlice";
import { upsertSplitDetails, removeSplitDetails } from "@/store/slices/chat/split/splitDetailsSlice";
import { supabase } from "@/utils/supabase";
import { SplitDetails, SplitMember } from "@/types/chat/split/splitDetails";
import { BaseBackendMessage } from "@/types/backend/baseMessage";
import { addSplitToList } from "@/store/slices/chat/split/splitListSlice";
import { Members } from "@/types/chat/split/splitListItem";
import { RootState } from "@/store/store";

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

    const currentUserId = useSelector(
        (state: RootState) => state.profile.userId
    );

    const createSplit = async (params: CreateSplitParams) => {
        setLoading(true);

        const tempMsgId = `temp-msg-${Date.now()}`;
        const tempSplitId = `temp-split-${Date.now()}`;
        const now = new Date().toISOString();

        // Build optimistic SplitDetails members (rich type used in splitDetailsSlice)
        const optimisticMembers: SplitMember[] = params.members.map(m => ({
            user_id: m.user_id,
            is_payer: m.user_id === params.paid_by,
            amount_owed: m.amount_owed,
            status: m.user_id === params.paid_by ? 'paid' : 'pending',
            paid_at: m.user_id === params.paid_by ? now : null,
            can_pay: m.user_id === currentUserId && m.user_id !== params.paid_by,
            name: null,
            username: null,
            avatar_url: null,
        }));

        const optimisticSplit: SplitDetails = {
            id: tempSplitId,
            chat_id,
            message_id: tempMsgId,
            created_by: currentUserId || "",
            paid_by: params.paid_by,
            title: params.title,
            total_amount: params.total_amount,
            currency: params.currency,
            split_type: params.split_type,
            status: 'pending',
            created_at: now,
            updated_at: null,
            settled_at: null,
            creator: { id: currentUserId || "", name: null, username: null, avatar_url: null },
            members: optimisticMembers,
        };

        // FIX: sender_id must be the creator (currentUserId), not paid_by.
        // These can differ when someone creates a split on behalf of another payer.
        const optimisticMsg: BaseBackendMessage<'system'> = {
            id: tempMsgId,
            chat_id,
            sender_id: currentUserId || "",
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

        dispatch(addMessage({ chat_id, message: optimisticMsg }));
        dispatch(upsertSplitDetails(optimisticSplit));

        try {
            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;
            if (!token) throw new Error("Authentication expired");

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

            // Replace optimistic entries with real server data
            dispatch(removeMessage({ chat_id, messageId: tempMsgId }));
            dispatch(removeSplitDetails({ splitId: tempSplitId, chatId: chat_id }));
            dispatch(addMessage({ chat_id, message: result }));

            const realSplit: SplitDetails | undefined = result?.entities?.splits?.[0];

            if (realSplit) {
                dispatch(upsertSplitDetails(realSplit));

                // Build splitListItem members from the richer SplitDetails members,
                // adding the fields that splitListItem.Members now requires.
                const listMembers: Members[] = (realSplit.members ?? []).map(m => ({
                    user_id: m.user_id,
                    name: m.name,
                    amount_owed: m.amount_owed,
                    status: m.status,
                    is_payer: m.is_payer,
                    can_pay: m.can_pay,
                }));

                dispatch(addSplitToList({
                    chatId: chat_id,
                    split: {
                        id: realSplit.id,
                        title: realSplit.title,
                        status: realSplit.status,
                        total_amount: realSplit.total_amount,
                        paid_by_user_info: (() => {
                            const payer = realSplit.members?.find(m => m.is_payer);
                            return payer ? { id: payer.user_id, name: payer.name } : null;
                        })(),
                        split_members: listMembers,
                        split_members_count: listMembers.length,
                        can_pay: listMembers.some(
                            m => m.user_id === currentUserId && m.can_pay
                        ),
                        created_at: realSplit.created_at,
                        updated_at: realSplit.updated_at,
                        settled_at: realSplit.settled_at,
                    },
                }));
            }

            return result;

        } catch (err) {
            dispatch(removeMessage({ chat_id, messageId: tempMsgId }));
            dispatch(removeSplitDetails({ splitId: tempSplitId, chatId: chat_id }));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { createSplit, loading };
}