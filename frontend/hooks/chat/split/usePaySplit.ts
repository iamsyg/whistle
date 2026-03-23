// frontend/hooks/chat/split/usePaySplit.ts

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "@/utils/supabase";
import { SplitListItem } from "@/types/chat/split/splitListItem";
import { updateSplitInList } from "@/store/slices/chat/split/splitListSlice";
import { RootState } from "@/store/store";

export function usePaySplit(chat_id: string) {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const myId = useSelector((state: RootState) => state.profile.userId);
 
    const splitList = useSelector(
        (state: RootState) => state.splitList.splitListsByChatId[chat_id] ?? []
    );

    const paySplit = async (split_id: string) => {
        setLoading(true);

        // 1. Snapshot original so we can revert on failure
        const original = splitList.find(s => s.id === split_id);
 
        if (original) {
            // 2. Optimistic patch:
            //    - mark the current user's member entry as paid
            //    - flip can_pay to false immediately
            //    - if all non-payers are now paid, optimistically settle too
            const payer_id = original.paid_by_user_info?.id;
 
            const optimisticMembers = original.split_members.map(m =>
                m.user_id === myId
                    ? { ...m, status: 'paid' as const, can_pay: false }
                    : m
            );
 
            const nonPayers = optimisticMembers.filter(m => m.user_id !== payer_id);
            const allPaid = nonPayers.every(m => m.status === 'paid');
 
            dispatch(updateSplitInList({
                chatId: chat_id,
                splitId: split_id,
                changes: {
                    split_members: optimisticMembers,
                    can_pay: false,
                    ...(allPaid && {
                        status: 'settled',
                        settled_at: new Date().toISOString(),
                    }),
                },
            }));
        }

        try {
            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;
            if (!token) throw new Error("Authentication expired");

            const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/split/pay/${split_id}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json().catch(() => null);
 
            if (!response.ok) {
                throw new Error(result?.detail || result?.message || "Request failed");
            }

            const updated: SplitListItem = result;

           dispatch(updateSplitInList({
                chatId: chat_id,
                splitId: split_id,
                changes: {
                    status: updated.status,
                    settled_at: updated.settled_at,
                    can_pay: false, 
                    split_members: updated.split_members,
                },
            }));
 
            return updated;


        } catch (err) {

            if (original) {
                dispatch(updateSplitInList({
                    chatId: chat_id,
                    splitId: split_id,
                    changes: {
                        status: original.status,
                        settled_at: original.settled_at,
                        can_pay: original.can_pay,
                        split_members: original.split_members,
                    },
                }));
            }
            
            throw err;
        }
        finally {
            setLoading(false);
        }
    };

    return { paySplit, loading };
};