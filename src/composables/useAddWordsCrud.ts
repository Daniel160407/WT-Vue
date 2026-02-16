import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";
import { DICTIONARY, WORDS } from "./constants";
import { useToast } from "primevue";
import { useStatisticsStore } from "../stores/useStatisticsStore";
import { useGlobalStore } from "@/stores/GlobalStore";
import { useAuth } from "@/composables/useAuth";
import type { WordForm } from "@/type/interfaces";

export const useAddWordsCrud = () => {
  const globalStore = useGlobalStore();
  const { statistics, dictionaryWords } = storeToRefs(globalStore);
  const { languageId } = useAuth();
  const statsStore = useStatisticsStore();
  const toast = useToast();

  const saving = ref(false);

  const currentLangStats = computed(() =>
    statistics.value.find((s) => s.language_id === languageId.value)
  );

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

  const processAdvancements = async () => {
    const advancements = currentLangStats.value?.advancements ?? [];

    const dayAdv = await statsStore.checkAndGetDayAdvancement(advancements);
    if (dayAdv) {
      toast.add({
        severity: "success",
        summary: "Advancement made!",
        detail: dayAdv,
        life: 6000,
      });
    }

    const wordAdv = await statsStore.checkAndGetWordsAdvancement(advancements);
    if (wordAdv) {
      toast.add({
        severity: "success",
        summary: "Advancement made!",
        detail: wordAdv,
        life: 6000,
      });
    }
  };

  const addWord = async (word: WordForm) => {
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
        await statsStore.increaseWordsLearned();
      }

      await statsStore.updateDayStreak();

      await globalStore.fetchStatistics();

      await processAdvancements();
      toast.add({
        severity: "success",
        summary: "Word added",
        detail: `Word ${word.word} with translation: ${word.meaning} was added successfully`,
        life: 3000,
      });
    } catch (error) {
      console.error(error);
      toast.add({
        severity: "error",
        summary: "Save failed",
        detail: "Could not save the word.",
        life: 4000,
      });
    } finally {
      saving.value = false;
    }
  };

  const addAIWord = async (word: WordForm) => {
    await addWord(word);
  };

  return { saving, addWord, addAIWord };
};
