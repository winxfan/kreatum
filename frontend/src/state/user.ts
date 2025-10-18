import { atom } from 'jotai';

export type User = {
  id: string;
  name?: string;
  avatar_url?: string | null;
  balance_tokens: number;
} | null;

export const userAtom = atom<User>(null);


