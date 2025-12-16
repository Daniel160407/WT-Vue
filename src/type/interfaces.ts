export interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  word_type: string;
  active: boolean;
  user_id: number;
  language_id: number;
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
