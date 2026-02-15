import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { useAuth } from "./useAuth";
import { db } from "../../firebase";
import { LANGUAGE_ID, LEVEL, WORDS_CATEGORY } from "./constants";
import type { Level } from "@/type/interfaces";
import { useStatisticsStore } from "@/stores/useStatisticsStore";
import { useToast } from "primevue";
import { useWordsCrud } from "./useWordsCrud";
import { useGlobalStore } from "@/stores/GlobalStore";
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";

export const useLevelCrud = () => {
  const { uid, languageId } = useAuth();
  const globalStore = useGlobalStore();
  const statsStore = useStatisticsStore();
  const toast = useToast();
  const { deleteAllWords } = useWordsCrud();
  const { fetchWords, fetchStatistics } = globalStore;
  const { statistics } = storeToRefs(globalStore);

  const saving = ref(false);

  const currentLangStats = computed(() =>
    statistics.value.find((s) => s.language_id === languageId.value)
  );

  const resetLevelAndDeleteWords = async (levelId: string) => {
    if (!uid.value) return;

    saving.value = true;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, LEVEL, levelId), { level: 1 });
      await batch.commit();

      await deleteAllWords();
      await fetchWords(WORDS_CATEGORY);
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Could not reset level or delete all words",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  const advanceLevel = async (level: Level) => {
    if (!uid.value) return;

    saving.value = true;

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, LEVEL, level.id), { level: increment(1) });
      await batch.commit();

      if (level.level === 5) {
        await resetLevelAndDeleteWords(level.id);

        await statsStore.increaseCycles();

        await fetchStatistics();

        const currentAdvancements = currentLangStats.value?.advancements ?? [];

        const cyclesAdvancement = await statsStore.checkAndGetCyclesAdvancement(
          currentAdvancements
        );

        if (cyclesAdvancement) {
          toast.add({
            severity: "success",
            summary: "New cycles streak!",
            detail: cyclesAdvancement,
            life: 6000,
          });
        }
        return;
      }
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Could not advance level",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  const deleteLevelByLanguageId = async (id: string) => {
    saving.value = true;
    try {
      const q = query(collection(db, LEVEL), where(LANGUAGE_ID, "==", id));
      const { docs } = await getDocs(q);

      if (docs[0]) {
        await deleteDoc(docs[0].ref);
      }
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Could not delete level",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  return {
    saving,

    advanceLevel,
    deleteLevelByLanguageId,
  };
};
