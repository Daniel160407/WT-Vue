import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import { LANGUAGE_ID, LEVEL, STATISTICS, USER_ID } from "./constants";
import type { Level, Statistics } from "@/type/interfaces";
import { ref } from "vue";

export const useCreateUserData = () => {
  const saving = ref(false);

  const createLevelForUser = async (userId: string, languageId: string) => {
    saving.value = true;
    try {
      const levelQuery = query(
        collection(db, LEVEL),
        where(USER_ID, "==", userId),
        where(LANGUAGE_ID, "==", languageId)
      );
      const snap = await getDocs(levelQuery);

      if (snap.empty) {
        const levelRef = doc(collection(db, LEVEL));
        const level: Omit<Level, "id"> = {
          level: 1,
          user_id: userId,
          language_id: languageId,
        };
        await setDoc(levelRef, level);
      }
    } catch (err) {
      console.error(err);
    } finally {
      saving.value = false;
    }
  };

  const createStatisticsForUser = async (
    userId: string,
    languageId: string
  ) => {
    saving.value = true;
    try {
      const statisticsQuery = query(
        collection(db, STATISTICS),
        where(USER_ID, "==", userId),
        where(LANGUAGE_ID, "==", languageId)
      );
      const snap = await getDocs(statisticsQuery);

      if (snap.empty) {
        const statisticsRef = doc(collection(db, STATISTICS));
        const stats: Omit<Statistics, "id"> = {
          words_learned: 0,
          cycles: 0,
          days: 0,
          advancements: [],
          last_activity: Timestamp.fromDate(new Date()),
          user_id: userId,
          language_id: languageId,
        };
        await setDoc(statisticsRef, stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      saving.value = false;
    }
  };

  return { saving, createLevelForUser, createStatisticsForUser };
};
