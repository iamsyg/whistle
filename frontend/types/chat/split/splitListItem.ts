// frontend/types/chat/split/splitListItem.ts

export type SplitListItem = {
    id: string,
    title?: string | null,
    status: 'pending' | 'settled' | 'cancelled',
    total_amount: number,
    paid_by_user_info: PaidBy | null,
    split_members: Members[],
    split_members_count: number,
    can_pay: boolean,
    created_at: string,
    updated_at: string | null,
    settled_at: string | null,
};

export type PaidBy = {
    id: string,
    name: string | null,
};

export type Members = {
    amount_owed: number,
    status: 'paid' | 'pending',
    user_id: string
};