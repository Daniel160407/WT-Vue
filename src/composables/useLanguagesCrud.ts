import { db } from "../../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { LANGUAGES } from "@/composables/constants";
import type { Language } from "@/type/interfaces";
import { useToast } from "primevue";
import { useDictionaryCrud } from "./useDictionaryCrud";
import { useLevelCrud } from "./useLevelCrud";
import { useStatisticsCrud } from "./useStatisticsCrud";

export const useLanguagesCrud = () => {
  const { uid } = useAuth();
  const toast = useToast();
  const { deleteAllDictionaryWordsByLanguageId } = useDictionaryCrud();
  const { deleteLevelByLanguageId } = useLevelCrud();
  const { deleteStatisticsByLanguageId } = useStatisticsCrud();

  const saving = ref(false);

  const addLanguage = async (
    languageData: Omit<Language, "id" | "user_id">
  ) => {
    if (!uid.value) return;

    saving.value = true;
    try {
      const docRef = await addDoc(collection(db, LANGUAGES), {
        ...languageData,
        user_id: uid.value,
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding language:", error);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Could not add a new language",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  const updateLanguage = async (
    id: string,
    updates: Partial<Omit<Language, "id" | "user_id">>
  ) => {
    saving.value = true;
    try {
      const langRef = doc(db, LANGUAGES, id);
      await updateDoc(langRef, updates);
    } catch (error) {
      console.error("Error updating language:", error);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Could not update a language",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  const deleteLanguage = async (id: string) => {
    saving.value = true;
    try {
      await Promise.all([
        deleteAllDictionaryWordsByLanguageId(id),
        deleteLevelByLanguageId(id),
        deleteStatisticsByLanguageId(id),
      ]);

      const langRef = doc(db, LANGUAGES, id);
      await deleteDoc(langRef);
    } catch (error) {
      console.error("Error during full cleanup deletion:", error);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Could not complete the deletion process",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  return {
    saving,
    addLanguage,
    updateLanguage,
    deleteLanguage,
  };
};
