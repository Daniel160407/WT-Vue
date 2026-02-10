import { doc, increment, writeBatch } from "firebase/firestore";
import { useAuth } from "./useAuth";
import { db } from "../../firebase";
import { LEVEL, WORDS_CATEGORY } from "./constants";
import type { Level } from "@/type/interfaces";
import { useStatisticsStore } from "@/stores/useStatisticsStore";
import { useToast } from "primevue";
import { useWordsCrud } from "./useWordsCrud";
import { useGlobalStore } from "@/stores/GlobalStore";
import { ref } from "vue";

export const useLevelCrud = () => {
  const { uid } = useAuth();
  const stats = useStatisticsStore();
  const toast = useToast();
  const { deleteAllWords } = useWordsCrud();
  const { fetchWords } = useGlobalStore();

  const saving = ref(false);

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
        await stats.increaseCycles();

        const cyclesAdvancement = await stats.checkAndGetCyclesAdvancement();

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

  return {
    saving,

    advanceLevel,
  };
};
