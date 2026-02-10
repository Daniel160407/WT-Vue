<script setup lang="ts">
import { FloatLabel, InputText } from "primevue";
import { ref, watch, computed } from "vue";
import { useAuth } from "@/composables/useAuth";
import type { DictionaryWord } from "@/type/interfaces";
import { useGlobalStore } from "@/stores/GlobalStore";
import { storeToRefs } from "pinia";
import { ARTICLES } from "@/composables/constants";

const { uid } = useAuth();
const { dictionaryWords } = storeToRefs(useGlobalStore());
const { fetchDictionaryWords } = useGlobalStore();

const searchQuery = ref("");
const expandedWordId = ref<string | null>(null);

const toggleExample = (wordId: string) => {
  expandedWordId.value = expandedWordId.value === wordId ? null : wordId;
};

const normalizeWord = (word: string) => {
  const lower = word.toLowerCase().trim();

  for (const article of ARTICLES) {
    if (lower.startsWith(article + " ")) {
      return lower.slice(article.length + 1);
    }
  }

  return lower;
};

const groupedWords = computed(() => {
  const q = searchQuery.value.toLowerCase();

  const filtered = dictionaryWords.value.filter(
    (word) =>
      word.word.toLowerCase().includes(q) ||
      word.meaning.toLowerCase().includes(q)
  );

  const sorted = [...filtered].sort((a, b) =>
    normalizeWord(a.word).localeCompare(normalizeWord(b.word))
  );

  return sorted.reduce<Record<string, DictionaryWord[]>>((acc, word) => {
    const normalized = normalizeWord(word.word);
    const letter = normalized.charAt(0).toUpperCase();

    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(word);

    return acc;
  }, {});
});

watch(uid, (newUid) => {
  if (newUid) fetchDictionaryWords();
});
</script>

<template>
  <div class="flex flex-col justify-start items-center min-h-screen w-full p-6">
    <div class="mt-10 max-w-3xl w-full p-6 bg-[#333333] rounded-2xl shadow-lg">
      <h1 class="text-[#ffc107] text-[30px] font-bold text-center mb-6">
        Dictionary
      </h1>

      <div class="mb-4">
        <FloatLabel variant="in">
          <InputText
            v-model="searchQuery"
            class="w-full bg-[#444444] text-white border-gray-600"
          />
          <label>Search by word or meaning...</label>
        </FloatLabel>
        <p class="text-sm text-gray-400 mt-2">
          Total words in dictionary: {{ dictionaryWords.length }}
        </p>
      </div>

      <div class="flex flex-col gap-6 mt-4">
        <div v-for="(group, letter) in groupedWords" :key="letter">
          <h2 class="text-[#ffc107] text-2xl font-bold mb-3">
            {{ letter }}
          </h2>

          <div class="flex flex-col gap-4">
            <div
              v-for="word in group"
              :key="word.id"
              class="bg-[#444444] rounded-xl p-4 border border-gray-500 hover:bg-[#555] transition-colors duration-300 cursor-pointer"
              @dblclick="toggleExample(word.id)"
            >
              <div class="flex justify-between items-center">
                <p class="text-[24px] text-white font-semibold">
                  {{ word.word }}
                  <span class="text-gray-300">– {{ word.meaning }}</span>
                </p>

                <span
                  class="px-3 py-1 text-sm rounded-full bg-[#18181b] text-[#ffc107]"
                >
                  {{ word.level }}
                </span>
              </div>

              <div
                v-if="expandedWordId === word.id && word.example"
                class="mt-3 p-4 bg-[#18181b] rounded-xl text-gray-300 border border-gray-600"
              >
                <p class="text-[#ffc107] font-semibold mb-1">Example</p>
                <p class="whitespace-pre-line">
                  {{ word.example }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
