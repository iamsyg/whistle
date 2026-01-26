// types/frontend/messageDraft.ts


export interface MessageDraft<TType extends string = string> {
text: string;
type: TType;
metadata?: Record<string, unknown>;
}