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
import { LEVEL, STATISTICS } from "./constants";
import type { Level, Statistics } from "@/type/interfaces";

export const useCreateUserData = () => {
  const createLevelForUser = async (userId: string, languageId: number = 1) => {
    try {
      const levelQuery = query(
        collection(db, LEVEL),
        where("user_id", "==", userId)
      );
      const snap = await getDocs(levelQuery);

      if (snap.empty) {
        const levelRef = doc(collection(db, LEVEL));
        const level: Omit<Level, "id"> = {
          level: 1,
          user_id: userId,
          language_id: languageId as any,
        };
        await setDoc(levelRef, level);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createStatisticsForUser = async (
    userId: string,
    languageId: number = 1
  ) => {
    try {
      const statisticsQuery = query(
        collection(db, STATISTICS),
        where("user_id", "==", userId)
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
          language_id: languageId as any,
        };
        await setDoc(statisticsRef, stats, { merge: true });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return {
    createLevelForUser,
    createStatisticsForUser,
  };
};
