import { collection, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { useToast } from "primevue";
import { ref } from "vue";
import { db } from "../../firebase";
import { LANGUAGE_ID, STATISTICS } from "./constants";

export const useStatisticsCrud = () => {
  const toast = useToast();
  const saving = ref(false);

  const deleteStatisticsByLanguageId = async (languageId: string) => {
    saving.value = true;
    try {
      const q = query(
        collection(db, STATISTICS),
        where(LANGUAGE_ID, "==", languageId)
      );
      const { docs } = await getDocs(q);

      if (docs[0]) {
        await deleteDoc(docs[0].ref);
      }
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Could not delete statistics",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  return {
    saving,
    deleteStatisticsByLanguageId,
  };
};
