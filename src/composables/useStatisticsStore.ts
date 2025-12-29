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
} from "firebase/firestore";
import { Advancements, STATISTICS, USER_ID } from "@/composables/constants";
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

      const { uid } = useAuth();
      console.log(!uid.value);
      if (!uid.value) return null;

      this.loading = true;

      const q = query(
        collection(db, STATISTICS),
        where(USER_ID, "==", uid.value)
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

    getDayAdvancement(): Advancement | null {
      const days = this.data?.days;

      switch (days) {
        case 1:
          return Advancements.ONEDAYSTREAK;
        case 3:
          return Advancements.THREEDAYSTREAK;
        case 7:
          return Advancements.WEEKSTREAK;
        case 14:
          return Advancements.TWOWEEKSTREAK;
        case 21:
          return Advancements.THREEWEEKSTREAK;
        case 30:
          return Advancements.MONTHSTREAK;
        case 60:
          return Advancements.TWOMONTHSTREAK;
        case 180:
          return Advancements.SIXMONTHSTREAK;
        case 365:
          return Advancements.ONEYEARSTREAK;
      }
      return null;
    },

    getCyclesAdvancement(): Advancement | null {
      const cycles = this.data?.cycles;

      switch (cycles + 1) {
        case 1:
          return Advancements.ONECYCLESTREAK;
        case 5:
          return Advancements.FIVECYCLESSTREAK;
        case 10:
          return Advancements.TENCYCLESSTREAK;
        case 20:
          return Advancements.TWENTYCYCLESSTREAK;
        case 30:
          return Advancements.THIRTYCYCLESSTREAK;
        case 50:
          return Advancements.FIFTYCYCLESSTREAK;
      }
      return null;
    },

    getWordsAdvancement(): Advancement | null {
      const words = this.data?.words_learned;

      switch (words) {
        case 10:
          return Advancements.TENWORDS;
        case 50:
          return Advancements.FIFTYWORDS;
        case 100:
          return Advancements.HUNDREDWORDS;
        case 300:
          return Advancements.THREEHUNDREDWORDS;
        case 500:
          return Advancements.FIVEHUNDREDWORDS;
        case 700:
          return Advancements.SEVENHUNDREDWORDS;
        case 1000:
          return Advancements.THOUSANDWORDS;
        case 3000:
          return Advancements.THREETHOUSANDWORDS;
        case 5000:
          return Advancements.FIVETHOUSANDWORDS;
      }
      return null;
    },

    reset() {
      this.statDoc = null;
    },
  },
});
