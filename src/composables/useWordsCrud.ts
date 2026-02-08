import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useAuth } from "./useAuth";
import { db } from "../../firebase";
import { ACTIVE, USER_ID, WORD_TYPE, WORDS, WORDS_CATEGORY } from "./constants";
import { useStatisticsStore } from "@/stores/useStatisticsStore";
import { useToast } from "primevue";
import type { Word } from "@/type/interfaces";

export const useWordsCrud = () => {
  const { uid } = useAuth();
  const stats = useStatisticsStore();
  const toast = useToast();

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

  const reactivateInactiveWords = async (): Promise<boolean> => {
    if (!uid.value) return false;

    const wordsSnapshot = await getDocs(
      query(
        collection(db, WORDS),
        where(USER_ID, "==", uid.value),
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
  };

  const dropWords = async (
    checkedWordIds: Set<string>,
    selectedWordType: string,
    totalWordsQuantity: number
  ) => {
    try {
      const batch = writeBatch(db);
      checkedWordIds.forEach((id) =>
        batch.update(doc(db, WORDS, id), { active: false })
      );

      await batch.commit();
      checkedWordIds.clear();

      if (totalWordsQuantity === 0) {
        // await advanceLevel();
        const hasReactivated = await reactivateInactiveWords();

        if (hasReactivated) {
          const reactivatedWordsSnapshot = await getDocs(
            createWordsQuery(selectedWordType, true)
          );
          return mapWords(reactivatedWordsSnapshot);
        }
      }
    } finally {
      await stats.updateDayStreak();
      const daysAdvancement = await stats.checkAndGetDayAdvancement();
      if (daysAdvancement) {
        toast.add({
          severity: "success",
          summary: "Advancement made!",
          detail: daysAdvancement,
          life: 6000,
        });
      }
    }
  };

  const updateWord = async (word: Word) => {
    try {
      const wordRef = doc(db, WORDS, word.id);
      const { ...updateData } = word;
      await updateDoc(wordRef, updateData);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteWord = async (id: string) => {
    try {
      await deleteDoc(doc(db, WORDS, id));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAllWords = async () => {
    try {
      const wordsSnapshot = await getDocs(
        query(
          collection(db, WORDS),
          where(WORD_TYPE, "==", WORDS_CATEGORY),
          where(USER_ID, "==", uid.value)
        )
      );

      const batch = writeBatch(db);
      wordsSnapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error("Failed to delete words:", error);
    }
  };

  return {
    dropWords,
    updateWord,
    deleteWord,
    deleteAllWords,
  };
};
