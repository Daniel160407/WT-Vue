import type {
  Level,
  DictionaryWord,
  Statistics,
  Word,
  Language,
} from "@/type/interfaces";
import { collection, getDocs, query, where } from "firebase/firestore";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { db } from "../../firebase";
import {
  ACTIVE,
  DICTIONARY,
  LANGUAGE_ID,
  LANGUAGES,
  LEVEL,
  STATISTICS,
  USER_ID,
  WORD_TYPE,
  WORDS,
} from "@/composables/constants";
import { useAuth } from "@/composables/useAuth";
import { useToast } from "primevue";

export const useGlobalStore = defineStore("globalStore", () => {
  const { uid, languageId } = useAuth();
  const toast = useToast();

  const words = ref<Word[]>([]);
  const dictionaryWords = ref<DictionaryWord[]>([]);
  const statistics = ref<Statistics[]>([]);
  const level = ref<Level | null>(null);
  const languages = ref<Language[]>([]);

  const loadingCount = ref<number>(0);
  const fetching = computed(() => loadingCount.value > 0);

  const withLoading = async <T>(fn: () => Promise<T>) => {
    loadingCount.value++;
    try {
      return await fn();
    } finally {
      loadingCount.value--;
    }
  };

  const createWordsQuery = (wordType: string, active: boolean) =>
    query(
      collection(db, WORDS),
      where(WORD_TYPE, "==", wordType),
      where(ACTIVE, "==", active),
      where(USER_ID, "==", uid.value),
      where(LANGUAGE_ID, "==", languageId.value)
    );

  const mapWords = (snapshot: any): Word[] =>
    snapshot.docs.map((d: any) => ({
      id: d.id,
      ...(d.data() as Omit<Word, "id">),
    }));

  const fetchWords = async (wordType: string) => {
    withLoading(async () => {
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
    });
  };

  const fetchDictionaryWords = async () => {
    withLoading(async () => {
      try {
        const snapshot = await getDocs(
          query(
            collection(db, DICTIONARY),
            where(USER_ID, "==", uid.value),
            where(LANGUAGE_ID, "==", languageId.value)
          )
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
    });
  };

  const fetchStatistics = async () => {
    withLoading(async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, STATISTICS), where(USER_ID, "==", uid.value))
        );
        statistics.value = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Statistics, "id">),
        }));
      } catch (err) {
        console.error(err);
        toast.add({
          severity: "error",
          summary: "Error appeared",
          detail: "Statistics could not be fetched",
          life: 3000,
        });
      }
    });
  };

  const fetchLevel = async () => {
    withLoading(async () => {
      try {
        const snapshot = await getDocs(
          query(
            collection(db, LEVEL),
            where(USER_ID, "==", uid.value),
            where(LANGUAGE_ID, "==", languageId.value)
          )
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
    });
  };

  const fetchLanguages = async () => {
    withLoading(async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, LANGUAGES), where(USER_ID, "==", uid.value))
        );

        languages.value = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Language, "id">),
        }));
      } catch (err) {
        console.error(err);
        toast.add({
          severity: "error",
          summary: "Error appeared",
          detail: "Languages could not be fetched",
          life: 3000,
        });
      }
    });
  };

  const setData = async () => {
    await Promise.allSettled([
      fetchWords("word"),
      fetchDictionaryWords(),
      fetchStatistics(),
      fetchLevel(),
      fetchLanguages(),
    ]);
  };

  return {
    fetching,

    words,
    dictionaryWords,
    statistics,
    level,
    languages,

    setData,

    fetchWords,
    fetchDictionaryWords,
    fetchStatistics,
    fetchLevel,
    fetchLanguages,
  };
});
