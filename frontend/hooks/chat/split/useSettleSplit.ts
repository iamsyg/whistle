// frontend/hooks/chat/split/useSettleSplit.ts

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "@/utils/supabase";
import { SplitListItem } from "@/types/chat/split/splitListItem";
import { updateSplitInList } from "@/store/slices/chat/split/splitListSlice";
import { RootState } from "@/store/store";

export function useSettleSplit(chat_id: string) {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const splitList = useSelector(
        (state: RootState) => state.splitList.splitListsByChatId[chat_id] ?? []
    );

    const settleSplit = async (split_id: string) => {
        setLoading(true);

         // 1. Snapshot original for revert
        const original = splitList.find(s => s.id === split_id);
 
        if (original) {
            // 2. Optimistic patch:
            //    - mark every pending member as paid
            //    - mark split as settled immediately
            const optimisticMembers = original.split_members.map(m =>
                m.status === 'pending'
                    ? { ...m, status: 'paid' as const, can_pay: false }
                    : m
            );
 
            dispatch(updateSplitInList({
                chatId: chat_id,
                splitId: split_id,
                changes: {
                    status: 'settled',
                    settled_at: new Date().toISOString(),
                    can_pay: false,
                    split_members: optimisticMembers,
                },
            }));
        }

        try {
            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;
            if (!token) throw new Error("Authentication expired");

            const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/chat/split/settle/${split_id}`,
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
                    can_pay: updated.can_pay, 
                    split_members: updated.split_members,
                },
            }));
 
            return updated;

        } catch (err) {

            // Revert to original on failure

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

    return { settleSplit, loading };
};