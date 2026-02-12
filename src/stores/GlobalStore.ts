import type {
  Level,
  DictionaryWord,
  Statistics,
  Word,
} from "@/type/interfaces";
import { collection, getDocs, query, where } from "firebase/firestore";
import { defineStore } from "pinia";
import { ref } from "vue";
import { db } from "../../firebase";
import {
  ACTIVE,
  DICTIONARY,
  LEVEL,
  STATISTICS,
  USER_ID,
  WORD_TYPE,
  WORDS,
} from "@/composables/constants";
import { useAuth } from "@/composables/useAuth";
import { useToast } from "primevue";

export const useGlobalStore = defineStore("globalStore", () => {
  const { uid } = useAuth();
  const toast = useToast();

  const words = ref<Word[]>([]);
  const dictionaryWords = ref<DictionaryWord[]>([]);
  const statistics = ref<Statistics | null>(null);
  const level = ref<Level | null>(null);

  const createWordsQuery = (wordType: string, active: boolean) =>
    query(
      collection(db, WORDS),
      where(WORD_TYPE, "==", wordType),
      where(ACTIVE, "==", active),
      where(USER_ID, "==", uid.value)
    );

  const mapWords = (snapshot: any): Word[] =>
    snapshot.docs.map((d: any) => ({
      id: d.id,
      ...(d.data() as Omit<Word, "id">),
    }));

  const fetchWords = async (wordType: string) => {
    try {
      const snapshot = await getDocs(createWordsQuery(wordType, true));
      words.value = mapWords(snapshot);
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Words could not be fetched",
        life: 3000,
      });
    }
  };

  const fetchDictionaryWords = async () => {
    try {
      const snapshot = await getDocs(
        query(collection(db, DICTIONARY), where(USER_ID, "==", uid.value))
      );

      dictionaryWords.value = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<DictionaryWord, "id">),
      }));
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Dictionary words could not be fetched",
        life: 3000,
      });
    }
  };

  const fetchStatistics = async () => {
    try {
      const snapshot = await getDocs(
        query(collection(db, STATISTICS), where(USER_ID, "==", uid.value))
      );
      const statsDoc = snapshot.docs[0];
      statistics.value = statsDoc
        ? { id: statsDoc.id, ...(statsDoc.data() as Omit<Statistics, "id">) }
        : null;
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Statistics could not be fetched",
        life: 3000,
      });
    }
  };

  const fetchLevel = async () => {
    try {
      const snapshot = await getDocs(
        query(collection(db, LEVEL), where(USER_ID, "==", uid.value))
      );

      if (snapshot.empty) {
        level.value = null;
        return;
      }

      const docSnap = snapshot.docs[0];

      level.value = {
        id: docSnap!.id,
        ...(docSnap!.data() as Omit<Level, "id">),
      };
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Level could not be fetched",
      });
    }
  };
  const setData = async () => {
    await Promise.allSettled([
      fetchWords("word"),
      fetchDictionaryWords(),
      fetchStatistics(),
      fetchLevel(),
    ]);
  };

  return {
    words,
    dictionaryWords,
    statistics,
    level,

    setData,

    fetchWords,
    fetchDictionaryWords,
    fetchStatistics,
    fetchLevel,
  };
});
