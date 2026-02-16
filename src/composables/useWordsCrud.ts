import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  Query,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useAuth } from "./useAuth";
import { db } from "../../firebase";
import {
  ACTIVE,
  ALL_CATEGORY,
  DROPPED_WORDS_CATEGORY,
  IRREGULAR_VERBS_CATEGORY,
  USER_ID,
  LANGUAGE_ID,
  WORD_TYPE,
  WORDS,
  WORDS_CATEGORY,
} from "./constants";
import { useStatisticsStore } from "@/stores/useStatisticsStore";
import { useToast } from "primevue";
import type { Word, WordCategory } from "@/type/interfaces";
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "@/stores/GlobalStore";

export const useWordsCrud = () => {
  const globalStore = useGlobalStore();
  const { statistics } = storeToRefs(globalStore);
  const { fetchStatistics } = globalStore;
  const { uid, languageId } = useAuth();
  const stats = useStatisticsStore();
  const toast = useToast();

  const saving = ref(false);

  const currentLangStats = computed(() =>
    statistics.value.find((s) => s.language_id === languageId.value)
  );

  const reactivateInactiveWords = async (): Promise<boolean> => {
    if (!uid.value || !languageId.value) return false;

    saving.value = true;
    try {
      const wordsSnapshot = await getDocs(
        query(
          collection(db, WORDS),
          where(USER_ID, "==", uid.value),
          where(LANGUAGE_ID, "==", languageId.value),
          where(ACTIVE, "==", false)
        )
      );

      if (wordsSnapshot.empty) return false;

      const batch = writeBatch(db);
      wordsSnapshot.docs.forEach((wordDoc) => {
        batch.update(doc(db, WORDS, wordDoc.id), { active: true });
      });

      await batch.commit();
      return true;
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Could not reactivate inactive words",
        life: 3000,
      });
      return false;
    } finally {
      saving.value = false;
    }
  };

  const dropWords = async (
    checkedWordIds: Set<string>,
    totalWordsQuantity: number
  ) => {
    if (!uid.value || !languageId.value) return;
    saving.value = true;

    try {
      const batch = writeBatch(db);
      checkedWordIds.forEach((id) =>
        batch.update(doc(db, WORDS, id), { active: false })
      );
      await batch.commit();

      let allDropped = false;
      if (totalWordsQuantity - checkedWordIds.size === 0) {
        allDropped = await reactivateInactiveWords();
      }

      await stats.updateDayStreak();

      await fetchStatistics();

      const advancements = currentLangStats.value?.advancements ?? [];
      const daysAdvancement = await stats.checkAndGetDayAdvancement(
        advancements
      );

      if (daysAdvancement) {
        toast.add({
          severity: "success",
          summary: "Advancement made!",
          detail: daysAdvancement,
          life: 6000,
        });
      }

      return allDropped;
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Could not drop words",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  const updateWord = async (word: Word) => {
    saving.value = true;

    try {
      const wordRef = doc(db, WORDS, word.id);
      const { ...updateData } = word;
      await updateDoc(wordRef, updateData);
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Could not update word",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  const deleteWord = async (id: string) => {
    saving.value = true;

    try {
      await deleteDoc(doc(db, WORDS, id));
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Could not delete word",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  const deleteAllWords = async () => {
    if (!uid.value || !languageId.value) return;
    saving.value = true;

    try {
      const wordsSnapshot = await getDocs(
        query(
          collection(db, WORDS),
          where(WORD_TYPE, "==", WORDS_CATEGORY),
          where(USER_ID, "==", uid.value),
          where(LANGUAGE_ID, "==", languageId.value)
        )
      );

      const batch = writeBatch(db);
      wordsSnapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error("Failed to delete words:", error);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Could not delete all words",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  const buildWordsQuery = (category: string): Query | null => {
    if (!uid.value || !languageId.value) return null;

    const baseColl = collection(db, WORDS);
    const userLangConstraint = [
      where(USER_ID, "==", uid.value),
      where(LANGUAGE_ID, "==", languageId.value),
    ];

    switch (category) {
      case WORDS_CATEGORY:
      case DROPPED_WORDS_CATEGORY:
        return query(
          baseColl,
          ...userLangConstraint,
          where(WORD_TYPE, "==", WORDS_CATEGORY),
          where(ACTIVE, "==", category === WORDS_CATEGORY)
        );

      case IRREGULAR_VERBS_CATEGORY:
        return query(
          baseColl,
          ...userLangConstraint,
          where(WORD_TYPE, "==", IRREGULAR_VERBS_CATEGORY),
          where(ACTIVE, "==", true)
        );

      case ALL_CATEGORY:
        return query(
          baseColl,
          ...userLangConstraint,
          where(WORD_TYPE, "==", WORDS_CATEGORY)
        );

      default:
        return null;
    }
  };

  const fetchTranslationsPageWords = async (
    category: WordCategory = WORDS_CATEGORY
  ) => {
    saving.value = true;

    try {
      const wordsQuery = buildWordsQuery(category);
      if (!wordsQuery) return;

      const snapshot = await getDocs(wordsQuery);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Could not fetch words",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  return {
    saving,

    dropWords,
    updateWord,
    deleteWord,
    deleteAllWords,
    fetchTranslationsPageWords,
  };
};
