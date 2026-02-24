// frontend/types/chat/split/splitDetails.ts

export type SplitDetails = {

    id: string,
    chat_id: string,
    message_id: string,

    created_by: string,
    title: string,
    total_amount: number,

    currency: "INR" | "USD" | "EUR" | "GBP" | string,
    split_type: "equally" | "unequally",
    status: "pending" | "settled" | "cancelled",

    created_at: string,
    updated_at: string,
    settled_at: string | null,

    paid_by: string,

    creator: Creator,

    members?: SplitMember[],
};

export type Creator = {
    id: string,
    name: string | null,
    username?: string | null,
    avatar_url?: string | null,
};

export type SplitMember = {

    user_id: string,
    is_payer: boolean,
    amount_owed: number,

    status: "pending" | "paid",
    paid_at: string | null,
    can_pay: boolean,
    
    name: string,
    username?: string,
    avatar_url?: string | null
};