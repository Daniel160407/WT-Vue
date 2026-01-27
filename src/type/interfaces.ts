import type { Advancements } from "@/composables/constants";
import type { Timestamp } from "firebase/firestore";

export type Language = "GEO" | "DEU";

export type WordLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type WordCategory =
  | "word"
  | "dropped"
  | "irregular"
  | "all"
  | "dictionary";

export type MessageSender = "user" | "gemini";

export type LevelStats = Record<WordLevel, number>;

export type Advancement = (typeof Advancements)[keyof typeof Advancements];

export type SentencePart =
  | { type: "text"; text: string }
  | { type: "input"; index: number };

export interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  word_type: WordCategory;
  active: boolean;
  user_id: string;
  language_id: Language;
}

export interface DictionaryWord {
  id: string;
  word: string;
  meaning: string;
  example: string;
  level: WordLevel;
  user_id: string;
  language_id: Language;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider?: string;
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
}

export interface Level {
  id: string;
  level: number;
  user_id: string;
  language_id: Language;
}

export interface MessageObj {
  id: string;
  payload: string;
  sender: MessageSender;
  created_at: number;
}

export interface Statistics {
  id: string;
  words_learned: number;
  cycles: number;
  days: number;
  advancements: string[];
  last_activity: Timestamp;
  user_id: string;
  language_id: Language;
}

export interface WordForm {
  word: string;
  meaning: string;
  example: string;
  word_type: string;
  level: string;
  active: boolean;
  user_id: string;
  language_id: string;
}
