import type { WordForm } from "@/type/interfaces";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";
import { DICTIONARY, WORDS } from "./constants";
import { useToast } from "primevue";
import { ref } from "vue";
import { useStatisticsStore } from "../stores/useStatisticsStore";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "@/stores/GlobalStore";

export const useAddWordsCrud = () => {
  const { statistics, dictionaryWords } = storeToRefs(useGlobalStore());
  const stats = useStatisticsStore();
  const toast = useToast();

  const saving = ref(false);

  const normalizeWord = (value: string) => value.toLowerCase().trim();

  const checkIfWordAlreadyExistsInDictionary = (word: WordForm): boolean => {
    const normalizedNew = normalizeWord(word.word);

    return dictionaryWords.value.some(
      (w) =>
        normalizeWord(w.word) === normalizedNew &&
        w.user_id === word.user_id &&
        w.language_id === word.language_id
    );
  };

  const addWord: (word: WordForm) => Promise<void> = async (word: WordForm) => {
    saving.value = true;

    try {
      await addDoc(collection(db, WORDS), word);

      if (!checkIfWordAlreadyExistsInDictionary(word)) {
        await addDoc(collection(db, DICTIONARY), {
          word: word.word,
          meaning: word.meaning,
          example: word.example,
          level: word.level,
          user_id: word.user_id,
          language_id: word.language_id,
        });
        await stats.increaseWordsLearned();
      }
      await stats.updateDayStreak();

      const dayAdv = await stats.checkAndGetDayAdvancement(
        statistics.value?.advancements ?? []
      );
      if (dayAdv) {
        toast.add({
          severity: "success",
          summary: "Advancement made!",
          detail: dayAdv,
          life: 6000,
        });
      }

      const wordAdv = await stats.checkAndGetWordsAdvancement(
        statistics.value?.advancements ?? []
      );
      if (wordAdv) {
        toast.add({
          severity: "success",
          summary: "Advancement made!",
          detail: wordAdv,
          life: 6000,
        });
      }
    } catch (error) {
      console.error(error);
      toast.add({
        severity: "error",
        summary: "Save failed",
        detail: "Could not save the word. Please try again.",
        life: 4000,
      });
    } finally {
      saving.value = false;
    }
  };

  const addAIWord = async (word: WordForm) => {
    saving.value = true;

    try {
      await addDoc(collection(db, WORDS), word);

      if (!checkIfWordAlreadyExistsInDictionary(word)) {
        await addDoc(collection(db, DICTIONARY), word);
        await stats.increaseWordsLearned();
      }
      await stats.updateDayStreak();

      const dayAdv = await stats.checkAndGetDayAdvancement(
        statistics.value?.advancements ?? []
      );
      if (dayAdv) {
        toast.add({
          severity: "success",
          summary: "Advancement made!",
          detail: dayAdv,
          life: 6000,
        });
      }

      const wordAdv = await stats.checkAndGetWordsAdvancement(
        statistics.value?.advancements ?? []
      );
      if (wordAdv) {
        toast.add({
          severity: "success",
          summary: "Advancement made!",
          detail: wordAdv,
          life: 6000,
        });
      }
    } catch (error) {
      console.error(error);
      toast.add({
        severity: "error",
        summary: "Save failed",
        detail: "Could not save the word. Please try again.",
        life: 4000,
      });
    } finally {
      saving.value = false;
    }
  };

  return {
    saving,

    addWord,
    addAIWord,
  };
};
