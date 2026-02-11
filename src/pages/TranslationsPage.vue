<script setup lang="ts">
import {
  ARTICLES,
  CAPITALS,
  DICTIONARY_CATEGORY,
  WORD_CATEGORIES,
  WORDS_CATEGORY,
} from "@/composables/constants";
import { Button, FloatLabel, InputText, Select } from "primevue";
import { ref, watch, computed } from "vue";
import { useAuth } from "@/composables/useAuth";
import type {
  DictionaryWord,
  Language,
  Word,
  WordCategory,
} from "@/type/interfaces";
import { useStatisticsStore } from "@/stores/useStatisticsStore";
import { useToast } from "primevue/usetoast";
import { useGlobalStore } from "@/stores/GlobalStore";
import { storeToRefs } from "pinia";
import { useWordsCrud } from "@/composables/useWordsCrud";

const { uid } = useAuth();
const stats = useStatisticsStore();
const toast = useToast();
const { fetchTranslationsPageWords } = useWordsCrud();
const { statistics, dictionaryWords } = storeToRefs(useGlobalStore());

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

const correctAnswersCount = computed(() => {
  return Object.values(results.value).filter(Boolean).length;
});

const totalAnswersCount = computed(() => {
  return words.value.length;
});

const percentage = computed(() => {
  if (!totalAnswersCount.value) return 0;
  return Math.round(
    (correctAnswersCount.value / totalAnswersCount.value) * 100
  );
});

const hasChecked = computed(() => {
  return Object.keys(results.value).length > 0;
});

const handleReset = () => {
  resetInputs();
};

const resetInputs = () => {
  translations.value = {};
  results.value = {};

  words.value.forEach((word) => {
    translations.value[word.id] = "";
  });
};

const normalizeWord = (input: string): string => {
  return input
    .trim()
    .split(/\s+/)
    .filter((word, index) =>
      index === 0 ? !ARTICLES.includes(word.toLowerCase()) : true
    )
    .join(" ");
};

const handleFetchDictionaryWords = async () => {
  words.value = dictionaryWords.value.filter((item) => {
    const cleanedWord = normalizeWord(item.word);

    return cleanedWord
      .toUpperCase()
      .startsWith(selectedCapital.value.toUpperCase());
  });

  resetInputs();
};

const fetchWords = async (category: WordCategory = WORDS_CATEGORY) => {
  if (!uid.value) return;

  try {
    showCapitals.value = category === DICTIONARY_CATEGORY;

    if (category === DICTIONARY_CATEGORY) {
      selectedCapital.value = "A";
      await handleFetchDictionaryWords();
      return;
    }

    words.value = shuffleArray((await fetchTranslationsPageWords()) ?? []);

    resetInputs();
  } catch (error) {
    console.error("fetchWords error:", error);
  }
};

const checkAnswers = async () => {
  results.value = {};

  words.value.forEach((word) => {
    const userInput = translations.value[word.id]?.trim().toLowerCase();

    const correctAnswer =
      selectedLanguage.value === "GEO" ? word.meaning : word.word;

    results.value[word.id] =
      userInput === (correctAnswer || "").trim().toLowerCase();
  });

  stats.updateDayStreak();
  const daysAdvancement = await stats.checkAndGetDayAdvancement(
    statistics.value?.advancements ?? []
  );
  if (daysAdvancement) {
    toast.add({
      severity: "success",
      summary: "Advancement made!",
      detail: daysAdvancement,
      life: 6000,
    });
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth",
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
    await handleFetchDictionaryWords();
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

      <div
        v-if="hasChecked"
        class="text-center mt-4 text-xl font-bold flex justify-between items-center"
        :class="percentage === 100 ? 'text-green-400' : 'text-yellow-400'"
      >
        <p>
          {{ correctAnswersCount }} / {{ totalAnswersCount }} Correct ({{
            percentage
          }}%)
        </p>
        <Button
          v-if="hasChecked"
          icon="pi pi-sync"
          @click="handleReset"
          class="bg-gray-600! border-gray-600! text-white! px-4!"
        />
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
            class="w-full bg-[#444444]! border! border-gray-400! focus:border-white! text-white"
          />

          <p
            v-if="word.id in results"
            :class="results[word.id] ? 'text-green-400' : 'text-red-400'"
            class="text-center font-semibold"
          >
            <span v-if="!results[word.id]">
              Correct:
              {{ selectedLanguage === "GEO" ? word.meaning : word.word }}
            </span>
            <span v-else>Correct!</span>
          </p>
        </div>
      </div>

      <div class="mt-4">
        <Button
          label="Check Answers"
          @click="checkAnswers"
          class="bg-[#ffc107]! border-[#ffc107]! text-black! w-full text-xl!"
        />
      </div>
    </div>
  </div>
</template>
