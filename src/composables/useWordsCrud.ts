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
import { ref } from "vue";

export const useWordsCrud = () => {
  const { uid } = useAuth();
  const stats = useStatisticsStore();
  const toast = useToast();

  const saving = ref(false);

  const reactivateInactiveWords = async (): Promise<boolean> => {
    if (!uid.value) return false;

    saving.value = true;

    try {
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
    saving.value = true;

    try {
      const batch = writeBatch(db);
      checkedWordIds.forEach((id) =>
        batch.update(doc(db, WORDS, id), { active: false })
      );

      await batch.commit();

      if (totalWordsQuantity - checkedWordIds.size === 0) {
        await reactivateInactiveWords();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Could not drop words to the next level",
        life: 3000,
      });
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
    saving.value = true;

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

  return {
    saving,

    dropWords,
    updateWord,
    deleteWord,
    deleteAllWords,
  };
};
