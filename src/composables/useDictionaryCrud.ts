import type { Word } from "@/type/interfaces";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import { DICTIONARY } from "./constants";
import { ref } from "vue";
import { useToast } from "primevue";

export const useDictionaryCrud = () => {
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
        where("user_id", "==", editingStartValue.user_id)
      );

      const snapshot = await getDocs(dictionaryQuery);

      if (snapshot.empty) return;

      const dictionaryDoc = snapshot.docs[0];
      const wordRef = doc(db, DICTIONARY, dictionaryDoc!.id);

      const updateData = {
        word: updatedWord.word,
        meaning: updatedWord.meaning,
        example: updatedWord.example,
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
        where("user_id", "==", word.user_id)
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

  return {
    saving,

    updateDictionaryWord,
    deleteDictionaryWord,
  };
};
