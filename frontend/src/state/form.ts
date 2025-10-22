import { atom } from 'jotai';

export type FormState = {
  values: Record<string, any>;
  files: File[];
};

// Хранит состояния форм по ключу modelId
export const formStatesAtom = atom<Record<string, FormState>>({});


