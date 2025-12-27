<script setup lang="ts">
import {
  ACTIVE,
  CAPITALS,
  DICTIONARY,
  DICTIONARY_CATEGORY,
  DROPPED_WORDS_CATEGORY,
  IRREGULAR_VERBS_CATEGORY,
  USER_ID,
  WORD_CATEGORIES,
  WORD_TYPE,
  WORDS,
  WORDS_CATEGORY,
} from "@/composables/constants";
import {
  collection,
  getDocs,
  query,
  where,
  type Query,
} from "firebase/firestore";
import { Button, FloatLabel, InputText, Select } from "primevue";
import { ref, watch } from "vue";
import { db } from "../../firebase";
import { useAuth } from "@/composables/useAuth";
import type {
  DictionaryWord,
  Language,
  Word,
  WordCategory,
} from "@/type/interfaces";

const { uid } = useAuth();

const selectedLanguage = ref<Language>("DEU");
const wordCategory = ref<{ name: string; code: WordCategory }>({
  name: "Words",
  code: WORDS_CATEGORY,
});

const words = ref<Array<Word | DictionaryWord>>([]);
const translations = ref<Record<string, string>>({});
const results = ref<Record<string, boolean>>({});

const showCapitals = ref(false);
const selectedCapital = ref<string>("A");

const resetInputs = () => {
  translations.value = {};
  results.value = {};

  words.value.forEach((word) => {
    translations.value[word.id] = "";
  });
};

const fetchDictionaryWords = async () => {
  const snapshot = await getDocs(collection(db, DICTIONARY));

  words.value = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<DictionaryWord, "id">),
    }))
    .filter((word) =>
      word.word.toUpperCase().startsWith(selectedCapital.value)
    );

  resetInputs();
};

const buildWordsQuery = (category: string): Query | null => {
  if (!uid.value) return null;

  switch (category) {
    case WORDS_CATEGORY:
    case DROPPED_WORDS_CATEGORY:
      return query(
        collection(db, WORDS),
        where(WORD_TYPE, "==", WORDS_CATEGORY),
        where(ACTIVE, "==", category === WORDS_CATEGORY),
        where(USER_ID, "==", uid.value)
      );

    case "irregular":
      return query(
        collection(db, WORDS),
        where(WORD_TYPE, "==", IRREGULAR_VERBS_CATEGORY),
        where(ACTIVE, "==", true),
        where(USER_ID, "==", uid.value)
      );

    case "all":
      return query(
        collection(db, WORDS),
        where(WORD_TYPE, "==", WORDS_CATEGORY),
        where(USER_ID, "==", uid.value)
      );

    default:
      return null;
  }
};

const fetchWords = async (category: WordCategory = WORDS_CATEGORY) => {
  if (!uid.value) return;

  try {
    showCapitals.value = category === DICTIONARY_CATEGORY;

    if (category === DICTIONARY_CATEGORY) {
      await fetchDictionaryWords();
      return;
    }

    selectedCapital.value = "A";

    const wordsQuery = buildWordsQuery(category);
    if (!wordsQuery) return;

    const snapshot = await getDocs(wordsQuery);

    words.value = shuffleArray(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }))
    );

    resetInputs();
  } catch (error) {
    console.error("fetchWords error:", error);
  }
};

const checkAnswers = () => {
  results.value = {};

  words.value.forEach((word) => {
    const userInput = translations.value[word.id]?.trim().toLowerCase();

    const correctAnswer =
      selectedLanguage.value === "GEO" ? word.meaning : word.word;

    results.value[word.id] =
      userInput === (correctAnswer || "").trim().toLowerCase();
  });
};

const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

watch(selectedCapital, async () => {
  if (wordCategory.value.code === DICTIONARY_CATEGORY) {
    await fetchDictionaryWords();
  }
});

watch(selectedLanguage, resetInputs);

watch(
  [uid, wordCategory],
  ([newUid, newCategory]) => {
    if (!newUid) return;
    fetchWords(newCategory.code);
  },
  { immediate: true }
);
</script>
<template>
  <div class="flex justify-center items-center flex-col w-full mt-10">
    <div
      class="flex flex-col bg-[#333333] p-1 md:p-4 rounded-[10px] border border-gray-400"
    >
      <div class="flex flex-col gap-4">
        <div class="flex gap-4 w-80">
          <FloatLabel variant="on" class="flex-1">
            <Select
              v-model="selectedLanguage"
              :options="[
                { name: 'Georgian', code: 'GEO' },
                { name: 'Deutsch', code: 'DEU' },
              ]"
              optionLabel="name"
              optionValue="code"
              class="w-full"
            />
            <label>Language</label>
          </FloatLabel>

          <FloatLabel variant="on" class="flex-1">
            <Select
              v-model="wordCategory"
              :options="WORD_CATEGORIES"
              optionLabel="name"
              class="w-full"
            />
            <label>Category</label>
          </FloatLabel>
        </div>

        <div v-if="showCapitals">
          <FloatLabel variant="on" class="flex-1">
            <Select
              v-model="selectedCapital"
              :options="CAPITALS"
              class="w-full"
            />
            <label>Capital</label>
          </FloatLabel>
        </div>
      </div>

      <div class="mt-6 w-80">
        <div
          v-for="word in words"
          :key="word.id"
          class="flex flex-col gap-3 mb-4 bg-[#444444] border border-gray-400 p-4 rounded-[10px]"
        >
          <p class="font-semibold text-center text-[29px]">
            {{ selectedLanguage === "GEO" ? word.word : word.meaning }}
          </p>

          <InputText
            v-model="translations[word.id]"
            class="w-full !bg-[#444444] !border !border-gray-400 focus:!border-white text-white"
          />

          <p
            v-if="word.id in results"
            :class="results[word.id] ? 'text-green-400' : 'text-red-400'"
            class="text-center font-semibold"
          >
            <span v-if="!results[word.id]">
              {{ "Correct: " }}
              {{ selectedLanguage === "GEO" ? word.meaning : word.word }}
            </span>
            <span v-else>Correct!</span>
          </p>
        </div>
      </div>

      <div>
        <Button
          label="Check Answers"
          @click="checkAnswers"
          class="!bg-[#ffc107] !border-[#ffc107] !text-black w-full !text-xl"
        />
      </div>
    </div>
  </div>
</template>
