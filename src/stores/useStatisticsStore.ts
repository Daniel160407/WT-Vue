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

    async addAdvancement(advancement: Advancement) {
      const doc = this.statDoc;
      if (!doc) return;

      await updateDoc(doc.ref, {
        advancements: arrayUnion(advancement),
      });
    },

    async checkAndGetDayAdvancement() {
      const days = this.data?.days;

      let advancement: Advancement | null = null;

      switch (days) {
        case 1:
          advancement = Advancements.ONEDAYSTREAK;
          break;
        case 3:
          advancement = Advancements.THREEDAYSTREAK;
          break;
        case 7:
          advancement = Advancements.WEEKSTREAK;
          break;
        case 14:
          advancement = Advancements.TWOWEEKSTREAK;
          break;
        case 21:
          advancement = Advancements.THREEWEEKSTREAK;
          break;
        case 30:
          advancement = Advancements.MONTHSTREAK;
          break;
        case 60:
          advancement = Advancements.TWOMONTHSTREAK;
          break;
        case 180:
          advancement = Advancements.SIXMONTHSTREAK;
          break;
        case 365:
          advancement = Advancements.ONEYEARSTREAK;
          break;
      }

      if (advancement) {
        await this.addAdvancement(advancement);
        return advancement;
      }
    },

    async checkAndGetCyclesAdvancement() {
      const cycles = this.data?.cycles;

      let advancement: Advancement | null = null;

      switch (cycles + 1) {
        case 1:
          advancement = Advancements.ONECYCLESTREAK;
          break;
        case 5:
          advancement = Advancements.FIVECYCLESSTREAK;
          break;
        case 10:
          advancement = Advancements.TENCYCLESSTREAK;
          break;
        case 20:
          advancement = Advancements.TWENTYCYCLESSTREAK;
          break;
        case 30:
          advancement = Advancements.THIRTYCYCLESSTREAK;
          break;
        case 50:
          advancement = Advancements.FIFTYCYCLESSTREAK;
          break;
      }

      if (advancement) {
        await this.addAdvancement(advancement);
        return advancement;
      }
    },

    async checkAndGetWordsAdvancement() {
      const words = this.data?.words_learned;

      let advancement: Advancement | null = null;

      switch (words) {
        case 10:
          advancement = Advancements.TENWORDS;
          break;
        case 50:
          advancement = Advancements.FIFTYWORDS;
          break;
        case 100:
          advancement = Advancements.HUNDREDWORDS;
          break;
        case 300:
          advancement = Advancements.THREEHUNDREDWORDS;
          break;
        case 500:
          advancement = Advancements.FIVEHUNDREDWORDS;
          break;
        case 700:
          advancement = Advancements.SEVENHUNDREDWORDS;
          break;
        case 1000:
          advancement = Advancements.THOUSANDWORDS;
          break;
        case 3000:
          advancement = Advancements.THREETHOUSANDWORDS;
          break;
        case 5000:
          advancement = Advancements.FIVETHOUSANDWORDS;
          break;
      }

      if (advancement) {
        await this.addAdvancement(advancement);
        return advancement;
      }
    },

    reset() {
      this.statDoc = null;
    },
  },
});
