<script setup lang="ts">
import { collection, getDocs, query, where } from "firebase/firestore";
import { ref, watch } from "vue";
import { db } from "../../firebase";
import { DICTIONARY, STATISTICS, USER_ID } from "@/composables/constants";
import { useAuth } from "@/composables/useAuth";
import type {
  DictionaryWord,
  LevelStats,
  Statistics,
  WordLevel,
} from "@/type/interfaces";

const emptyLevelStats = (): LevelStats => ({
  A1: 0,
  A2: 0,
  B1: 0,
  B2: 0,
  C1: 0,
  C2: 0,
});

const { uid } = useAuth();

const wordsLearned = ref<number>(0);
const cyclesCompleted = ref<number>(0);
const dayStreak = ref<number>(0);
const advancements = ref<string[]>([]);
const wordLevelContribution = ref<LevelStats>(emptyLevelStats());

const fetchWords = async () => {
  if (!uid.value) return;

  wordsLearned.value = 0;
  wordLevelContribution.value = emptyLevelStats();

  try {
    const snapshot = await getDocs(
      query(collection(db, DICTIONARY), where(USER_ID, "==", uid.value))
    );

    const words: DictionaryWord[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<DictionaryWord, "id">),
    }));

    for (const { level } of words) {
      if (level in wordLevelContribution.value) {
        wordLevelContribution.value[level as WordLevel]++;
      }
    }
  } catch (error) {
    console.error("Failed to fetch words:", error);
  }
};

const fetchStatistics = async () => {
  if (!uid.value) return;

  try {
    const snapshot = await getDocs(
      query(collection(db, STATISTICS), where(USER_ID, "==", uid.value))
    );
    const statistics = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Statistics, "id">),
    }));

    wordsLearned.value = statistics[0]?.words_learned ?? 0;
    cyclesCompleted.value = statistics[0]?.cycles ?? 0;
    dayStreak.value = statistics[0]?.days ?? 0;
    advancements.value = statistics[0]?.advancements ?? [];
  } catch (err) {
    console.error(err);
  }
};

watch(
  uid,
  (newUid) => {
    if (newUid) {
      fetchWords();
      fetchStatistics();
    }
  },
  { immediate: true }
);
</script>
<template>
  <div class="flex flex-col items-center gap-8 px-4">
    <div class="flex flex-col items-center mt-6 text-center">
      <h1
        class="text-[#ffc107] text-3xl md:text-4xl font-extrabold tracking-tight mb-2"
      >
        Your Learning Statistics
      </h1>
      <p class="text-[#acacac] text-sm md:text-base">
        Track your progress and achievements
      </p>
    </div>

    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10 w-full max-w-6xl"
    >
      <div
        class="flex items-center border border-[#333333] gap-5 p-6 rounded-2xl bg-linear-to-br from-[#262626] to-[#1e1e1e] shadow-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
      >
        <div
          class="flex justify-center items-center w-16 h-16 rounded-2xl bg-linear-to-br from-[#3f3f3f] to-[#2f2f2f] text-yellow-400 text-2xl shadow-inner"
        >
          <i class="pi pi-book"></i>
        </div>

        <div class="flex flex-col leading-tight">
          <p class="text-4xl font-extrabold text-white">
            {{ wordsLearned }}
          </p>
          <p class="text-xs uppercase tracking-widest text-gray-400">
            Words Learned
          </p>
        </div>
      </div>

      <div
        class="flex items-center border border-[#333333] gap-5 p-6 rounded-2xl bg-linear-to-br from-[#262626] to-[#1e1e1e] shadow-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
      >
        <div
          class="flex justify-center items-center w-16 h-16 rounded-2xl bg-linear-to-br from-[#2b3b55] to-[#1f2a3f] text-sky-400 text-2xl shadow-inner"
        >
          <i class="pi pi-sync"></i>
        </div>

        <div class="flex flex-col leading-tight">
          <p class="text-4xl font-extrabold text-white">
            {{ cyclesCompleted }}
          </p>
          <p class="text-xs uppercase tracking-widest text-gray-400">
            Cycles Completed
          </p>
        </div>
      </div>

      <div
        class="flex items-center border border-[#333333] gap-5 p-6 rounded-2xl bg-linear-to-br from-[#262626] to-[#1e1e1e] shadow-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
      >
        <div
          class="flex justify-center items-center w-16 h-16 rounded-2xl bg-linear-to-br from-[#4a2b1b] to-[#2a160d] text-orange-400 text-2xl shadow-inner"
        >
          <i class="fas fa-fire animate-pulse"></i>
        </div>

        <div class="flex flex-col leading-tight">
          <p class="text-4xl font-extrabold text-white">
            {{ dayStreak }}
          </p>
          <p class="text-xs uppercase tracking-widest text-gray-400">
            Day Streak
          </p>
        </div>
      </div>
    </div>
  </div>

  <div
    class="w-full max-w-6xl mt-10 p-6 rounded-2xl bg-linear-to-br from-[#262626] to-[#1e1e1e] shadow-lg"
  >
    <h2 class="text-lg md:text-xl font-bold tracking-wide text-white mb-6">
      Word Level Contribution
    </h2>

    <ul class="grid grid-cols-2 sm:grid-cols-3 gap-6">
      <li
        class="flex flex-col items-center justify-center p-5 rounded-xl bg-[#1c1c1c] hover:bg-[#222] transition-colors duration-300"
      >
        <span class="text-sm uppercase tracking-widest text-gray-400">A1</span>
        <span class="text-3xl font-extrabold text-emerald-400">
          {{ wordLevelContribution.A1 }}
        </span>
      </li>

      <li
        class="flex flex-col items-center justify-center p-5 rounded-xl bg-[#1c1c1c] hover:bg-[#222] transition-colors duration-300"
      >
        <span class="text-sm uppercase tracking-widest text-gray-400">A2</span>
        <span class="text-3xl font-extrabold text-lime-400">
          {{ wordLevelContribution.A2 }}
        </span>
      </li>

      <li
        class="flex flex-col items-center justify-center p-5 rounded-xl bg-[#1c1c1c] hover:bg-[#222] transition-colors duration-300"
      >
        <span class="text-sm uppercase tracking-widest text-gray-400">B1</span>
        <span class="text-3xl font-extrabold text-sky-400">
          {{ wordLevelContribution.B1 }}
        </span>
      </li>

      <li
        class="flex flex-col items-center justify-center p-5 rounded-xl bg-[#1c1c1c] hover:bg-[#222] transition-colors duration-300"
      >
        <span class="text-sm uppercase tracking-widest text-gray-400">B2</span>
        <span class="text-3xl font-extrabold text-indigo-400">
          {{ wordLevelContribution.B2 }}
        </span>
      </li>

      <li
        class="flex flex-col items-center justify-center p-5 rounded-xl bg-[#1c1c1c] hover:bg-[#222] transition-colors duration-300"
      >
        <span class="text-sm uppercase tracking-widest text-gray-400">C1</span>
        <span class="text-3xl font-extrabold text-purple-400">
          {{ wordLevelContribution.C1 }}
        </span>
      </li>

      <li
        class="flex flex-col items-center justify-center p-5 rounded-xl bg-[#1c1c1c] hover:bg-[#222] transition-colors duration-300"
      >
        <span class="text-sm uppercase tracking-widest text-gray-400">C2</span>
        <span class="text-3xl font-extrabold text-pink-400">
          {{ wordLevelContribution.C2 }}
        </span>
      </li>
    </ul>
  </div>

  <div
    class="w-full max-w-6xl mt-12 p-6 rounded-2xl bg-linear-to-br from-[#262626] to-[#1e1e1e] shadow-lg"
  >
    <h2 class="text-lg md:text-xl font-bold tracking-wide text-white mb-6">
      Your Achievements
    </h2>

    <div
      v-if="advancements.length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="advancement in advancements"
        :key="advancement"
        class="flex items-center gap-4 p-5 rounded-xl bg-[#1c1c1c] hover:bg-[#222] transition-all duration-300 shadow-md hover:shadow-lg"
      >
        <div
          class="flex justify-center items-center w-12 h-12 rounded-xl bg-linear-to-br from-yellow-500/20 to-yellow-700/20 text-yellow-400 text-xl"
        >
          <i class="pi pi-crown"></i>
        </div>

        <div class="flex-1">
          <p class="text-sm md:text-base font-semibold text-white leading-snug">
            {{ advancement }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center py-10 text-gray-400"
    >
      <i class="pi pi-lock text-3xl mb-3"></i>
      <p class="text-sm">No achievements unlocked yet</p>
    </div>
  </div>
</template>
