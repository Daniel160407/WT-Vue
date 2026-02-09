import type { Word } from "@/type/interfaces";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import { DICTIONARY } from "./constants";

export const useDictionaryCrud = () => {
  const deleteDictionaryWord = async (word: Word) => {
    const dictionaryQuery = query(
      collection(db, DICTIONARY),
      where("word", "==", word.word),
      where("meaning", "==", word.meaning)
    );

    const snapshot = await getDocs(dictionaryQuery);
    if (!snapshot.empty) {
      await deleteDoc(doc(db, DICTIONARY, snapshot.docs[0]!.id));
    }
  };

  return {
    deleteDictionaryWord,
  };
};
