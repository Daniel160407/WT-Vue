import type { Word } from "@/type/interfaces";
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
import { db } from "../../firebase";
import { DICTIONARY, LANGUAGE_ID, USER_ID } from "./constants";
import { ref } from "vue";
import { useToast } from "primevue";
import { useAuth } from "./useAuth";

export const useDictionaryCrud = () => {
  const { uid, languageId } = useAuth();
  const toast = useToast();
  const saving = ref(false);

  const updateDictionaryWord = async (
    editingStartValue: Word,
    updatedWord: Word
  ) => {
    saving.value = true;

    try {
      const dictionaryQuery = query(
        collection(db, DICTIONARY),
        where("word", "==", editingStartValue.word),
        where("meaning", "==", editingStartValue.meaning),
        where(USER_ID, "==", editingStartValue.user_id),
        where(LANGUAGE_ID, "==", languageId)
      );

      const snapshot = await getDocs(dictionaryQuery);

      if (snapshot.empty) return;

      const dictionaryDoc = snapshot.docs[0];
      const wordRef = doc(db, DICTIONARY, dictionaryDoc!.id);

      const updateData = {
        word: updatedWord.word,
        meaning: updatedWord.meaning,
        example: updatedWord.example,
        level: updatedWord.level,
        language_id: updatedWord.language_id,
        user_id: updatedWord.user_id,
      };

      await updateDoc(wordRef, updateData);
    } catch (err) {
      console.error("Failed to update dictionary word:", err);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Could not update dictionary word",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  const deleteDictionaryWord = async (word: Word) => {
    saving.value = true;

    try {
      const dictionaryQuery = query(
        collection(db, DICTIONARY),
        where("word", "==", word.word),
        where("meaning", "==", word.meaning),
        where(USER_ID, "==", word.user_id),
        where(LANGUAGE_ID, "==", word.language_id)
      );

      const snapshot = await getDocs(dictionaryQuery);
      if (!snapshot.empty) {
        await deleteDoc(doc(db, DICTIONARY, snapshot.docs[0]!.id));
      }
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Could not delete dictionary word",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  const deleteAllDictionaryWordsByLanguageId = async (id: string) => {
    if (!uid.value) return;
    saving.value = true;

    try {
      const q = query(
        collection(db, DICTIONARY),
        where(USER_ID, "==", uid.value),
        where(LANGUAGE_ID, "==", id)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) return;

      const batch = writeBatch(db);

      snapshot.docs.forEach((document) => {
        batch.delete(document.ref);
      });

      await batch.commit();
    } catch (err) {
      console.error("Failed to clear dictionary:", err);
      toast.add({
        severity: "error",
        summary: "Error appeared",
        detail: "Could not clear dictionary words",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  return {
    saving,

    updateDictionaryWord,
    deleteDictionaryWord,
    deleteAllDictionaryWordsByLanguageId,
  };
};
