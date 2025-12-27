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
  <div>
    <div>
      <h1>Your Learning Statistics</h1>
      <p>Track your progress and achievements</p>
    </div>
    <div>
      <div>
        <div>
          <i class="pi pi-book"></i>
        </div>
        <div>
          <p>{{ wordsLearned }}</p>
          <p>WORDS LEARNED</p>
        </div>
      </div>
      <div>
        <div>
          <i class="pi pi-sync"></i>
        </div>
        <div>
          <p>{{ cyclesCompleted }}</p>
          <p>CYCLES COMPLETED</p>
        </div>
      </div>
      <div>
        <div><i class="fas fa-fire"></i></div>
        <div>
          <p>{{ dayStreak }}</p>
          <p>DAY STREAK</p>
        </div>
      </div>
    </div>
  </div>
  <div>
    <h2>Word Level Contribution</h2>
    <ul class="grid grid-cols-3">
      <li>A1: {{ wordLevelContribution.A1 }}</li>
      <li>A2: {{ wordLevelContribution.A2 }}</li>
      <li>B1: {{ wordLevelContribution.B1 }}</li>
      <li>B2: {{ wordLevelContribution.B2 }}</li>
      <li>C1: {{ wordLevelContribution.C1 }}</li>
      <li>C2: {{ wordLevelContribution.C2 }}</li>
    </ul>
  </div>
</template>
