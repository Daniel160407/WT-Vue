import { defineStore } from "pinia";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  increment,
  serverTimestamp,
  Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
  arrayUnion,
} from "firebase/firestore";
import {
  Advancements,
  LANGUAGE_ID,
  STATISTICS,
  USER_ID,
} from "@/composables/constants";
import { useAuth } from "@/composables/useAuth";
import { db } from "../../firebase";
import type { Advancement } from "@/type/interfaces";

export const useStatisticsStore = defineStore("statistics", {
  state: () => ({
    statDoc: null as QueryDocumentSnapshot<DocumentData> | null,
    loading: false,
  }),

  getters: {
    data: (state) => state.statDoc?.data(),
  },

  actions: {
    async fetchStatistics() {
      const { uid, languageId } = useAuth();
      if (!uid.value) return null;

      this.loading = true;

      const q = query(
        collection(db, STATISTICS),
        where(USER_ID, "==", uid.value),
        where(LANGUAGE_ID, "==", languageId.value)
      );

      const snapshot = await getDocs(q);
      this.loading = false;

      if (snapshot.empty) return null;

      const firstDoc = snapshot.docs[0];
      if (!firstDoc) return null;

      this.statDoc = firstDoc;
      return firstDoc;
    },

    async increaseWordsLearned() {
      const doc = await this.fetchStatistics();
      if (!doc) return;

      await updateDoc(doc.ref, {
        words_learned: increment(1),
      });
    },

    async decreaseWordsLearned() {
      const doc = await this.fetchStatistics();
      if (!doc) return;

      await updateDoc(doc.ref, {
        words_learned: increment(-1),
      });
    },

    async increaseCycles() {
      const doc = await this.fetchStatistics();
      if (!doc) return;

      await updateDoc(doc.ref, {
        cycles: increment(1),
      });
    },

    async updateDayStreak() {
      const doc = await this.fetchStatistics();
      if (!doc) return;

      const data = doc.data();
      const lastActivity = data.last_activity as Timestamp | undefined;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!lastActivity) {
        await updateDoc(doc.ref, {
          days: 0,
          last_activity: serverTimestamp(),
        });
        return;
      }

      const lastDate = lastActivity.toDate();
      lastDate.setHours(0, 0, 0, 0);

      const diffDays =
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 0) return;

      if (diffDays === 1) {
        await updateDoc(doc.ref, {
          days: increment(1),
          last_activity: serverTimestamp(),
        });
      } else {
        await updateDoc(doc.ref, {
          days: 0,
          last_activity: serverTimestamp(),
        });
      }
    },

    async addAdvancement(advancement: Advancement) {
      const doc = this.statDoc;
      if (!doc) return;

      await updateDoc(doc.ref, {
        advancements: arrayUnion(advancement),
      });
    },

    async checkAndGetDayAdvancement(existingAdvancements: string[]) {
      const days = this.data?.days;

      if (!days) return;

      const dayToAdvancementMap: Record<number, Advancement> = {
        1: Advancements.ONEDAYSTREAK,
        3: Advancements.THREEDAYSTREAK,
        7: Advancements.WEEKSTREAK,
        14: Advancements.TWOWEEKSTREAK,
        21: Advancements.THREEWEEKSTREAK,
        30: Advancements.MONTHSTREAK,
        60: Advancements.TWOMONTHSTREAK,
        180: Advancements.SIXMONTHSTREAK,
        365: Advancements.ONEYEARSTREAK,
      };

      const advancement = dayToAdvancementMap[days];

      if (!advancement) return;

      if (existingAdvancements.includes(advancement)) return;

      await this.addAdvancement(advancement);

      return advancement;
    },

    async checkAndGetCyclesAdvancement(existingAdvancements: string[]) {
      const cycles = this.data?.cycles;

      if (cycles == null) return;

      const CYCLE_ADVANCEMENT_MAP: Record<number, Advancement> = {
        1: Advancements.ONECYCLESTREAK,
        5: Advancements.FIVECYCLESSTREAK,
        10: Advancements.TENCYCLESSTREAK,
        20: Advancements.TWENTYCYCLESSTREAK,
        30: Advancements.THIRTYCYCLESSTREAK,
        50: Advancements.FIFTYCYCLESSTREAK,
      };

      const nextCycle = cycles + 1;

      const advancement = CYCLE_ADVANCEMENT_MAP[nextCycle];

      if (!advancement || existingAdvancements.includes(advancement)) return;

      await this.addAdvancement(advancement);
      return advancement;
    },

    async checkAndGetWordsAdvancement(existingAdvancements: string[]) {
      const words = this.data?.words_learned;

      if (words == null) return;

      const WORD_ADVANCEMENT_MAP: Record<number, Advancement> = {
        10: Advancements.TENWORDS,
        50: Advancements.FIFTYWORDS,
        100: Advancements.HUNDREDWORDS,
        300: Advancements.THREEHUNDREDWORDS,
        500: Advancements.FIVEHUNDREDWORDS,
        700: Advancements.SEVENHUNDREDWORDS,
        1000: Advancements.THOUSANDWORDS,
        3000: Advancements.THREETHOUSANDWORDS,
        5000: Advancements.FIVETHOUSANDWORDS,
      };

      const advancement = WORD_ADVANCEMENT_MAP[words];

      if (!advancement || existingAdvancements.includes(advancement)) return;

      await this.addAdvancement(advancement);
      return advancement;
    },
  },
});
