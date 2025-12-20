export interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  word_type: string;
  active: boolean;
  user_id: string;
  language_id: string;
}

export interface Level {
  id: string;
  level: number;
  user_id: string;
  language_id: string;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface Level {
  id: string;
  level: number;
  user_id: string;
  language_id: string;
}

export interface DictionaryWord {
  id: string;
  word: string;
  meaning: string;
  example: string;
  level: string;
  user_id: string;
  language_id: string;
}
