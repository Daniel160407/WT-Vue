<script setup lang="ts">
import { onMounted, ref, watch, computed } from "vue";
import { type Level, type Word } from "@/type/interfaces";
import { db } from "../../firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { LEVEL, WORD_TYPE_OPTIONS, WORDS } from "@/composables/constants";
import Select from "primevue/select";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import { ProgressSpinner } from "primevue";

const words = ref<Word[]>([]);
const level = ref<Level>();
const loading = ref(false);
const selectedWordType = ref<{ name: string; code: string }>();
const expandedWordId = ref<string | null>(null);
const checkedWordIds = ref<Set<string>>(new Set());

const selectedWordTypeCode = computed(() => selectedWordType.value?.code);
const allWordsChecked = computed(() => {
  if (words.value.length === 0) return false;
  return checkedWordIds.value.size === words.value.length;
});
const hasCheckedWords = computed(() => checkedWordIds.value.size > 0);
const selectedWordCount = computed(() => checkedWordIds.value.size);

const toggleWordExamples = (wordId: string) => {
  expandedWordId.value = expandedWordId.value === wordId ? null : wordId;
};

const toggleWordCheck = (wordId: string, checked: boolean) => {
  if (checked) {
    checkedWordIds.value.add(wordId);
  } else {
    checkedWordIds.value.delete(wordId);
  }
};

const handleSelectAllChange = (value: boolean) => {
  if (value) {
    words.value.forEach((word) => checkedWordIds.value.add(word.id));
  } else {
    checkedWordIds.value.clear();
  }
};

const dropWords = async () => {
  if (!hasCheckedWords.value) return;

  loading.value = true;
  try {
    const batch = writeBatch(db);

    checkedWordIds.value.forEach((wordId) => {
      const wordRef = doc(db, WORDS, wordId);
      batch.update(wordRef, { active: false });
    });

    await batch.commit();

    checkedWordIds.value.clear();

    if (selectedWordTypeCode.value) {
      await fetchWords(selectedWordTypeCode.value);
    }
  } catch (err) {
    console.error("Error deactivating words:", err);
    throw new Error("Failed to deactivate words");
  } finally {
    loading.value = false;
  }
};

const fetchLevel = async () => {
  loading.value = true;

  try {
    const snapshot = await getDocs(collection(db, LEVEL));

    if (snapshot.empty) {
      level.value = undefined;
      return;
    }

    const docSnap = snapshot.docs[0];

    level.value = {
      id: docSnap!.id,
      ...(docSnap!.data() as Omit<Level, "id">),
    };
  } catch (error) {
    console.error("Failed to fetch level:", error);
  } finally {
    loading.value = false;
  }
};

const fetchWords = async (wordType: string) => {
  loading.value = true;
  try {
    const wordsRef = collection(db, WORDS);
    const wordsQuery = query(
      wordsRef,
      where("word_type", "==", wordType),
      where("active", "==", true)
    );

    const wordsSnapshot = await getDocs(wordsQuery);
    words.value = wordsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Word[];

    expandedWordId.value = null;
  } catch (err) {
    console.error("Error fetching words:", err);
    throw new Error("Failed to load words");
  } finally {
    loading.value = false;
  }
};

watch(selectedWordTypeCode, (newType) => {
  if (newType) {
    fetchWords(newType);
  }
});

watch(words, () => {
  checkedWordIds.value.clear();
});

onMounted(() => {
  if (WORD_TYPE_OPTIONS.length > 0) {
    selectedWordType.value = WORD_TYPE_OPTIONS[0];
  }
  fetchLevel();
});
</script>

<template>
  <div class="flex flex-col justify-start items-center min-h-screen p-6">
    <div class="mt-10 max-w-3xl w-full p-6 bg-[#333333] rounded-2xl shadow-lg">
      <h1 class="text-[#ffc107] text-[30px] font-bold text-center mb-6">
        Level {{ level?.level }}
      </h1>

      <div
        class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6"
      >
        <Select
          v-model="selectedWordType"
          :options="WORD_TYPE_OPTIONS"
          optionLabel="name"
          placeholder="Select word type"
          checkmark
          :highlightOnSelect="false"
          class="w-full md:w-56"
        />
        <div class="flex items-center gap-2 text-white">
          <Checkbox
            v-model="allWordsChecked"
            binary
            :disabled="words.length === 0"
            @update:modelValue="handleSelectAllChange"
            class="text-yellow-400"
          />
          <span class="text-sm font-medium">Select All</span>
        </div>
      </div>

      <div>
        <div
          v-if="loading && words.length === 0"
          class="flex items-center justify-center py-10"
        >
          <ProgressSpinner
            style="width: 60px; height: 60px"
            strokeWidth="3"
            fill="transparent"
            animationDuration=".5s"
            aria-label="Loading Members"
          />
        </div>

        <div
          v-else-if="words.length === 0"
          class="text-center text-gray-400 py-6"
        >
          No words found
        </div>

        <div v-else class="flex flex-col gap-4">
          <div
            v-for="word in words"
            :key="word.id"
            class="bg-[#444444] rounded-xl p-4 border border-gray-500 flex justify-center md:flex-row md:items-center gap-3 hover:bg-[#555] transition-colors duration-300"
          >
            <div class="flex flex-col justify-center items-center w-full">
              <p class="text-[40px]">
                {{ word.word }} -
                <span>{{ word.meaning }}</span>
              </p>
              <div
                v-if="expandedWordId === word.id && word.example"
                class="mt-2 text-gray-300 p-4 bg-[#18181b] rounded-[10px] w-full"
              >
                <p class="text-[#ffc107] text-lg">Example usages:</p>
                <p>
                  {{ word.example }}
                </p>
              </div>
            </div>

            <div class="flex flex-col items-center gap-2 mt-2 md:mt-0">
              <Checkbox
                binary
                variant="filled"
                :modelValue="checkedWordIds.has(word.id)"
                @update:modelValue="(isChecked: boolean) => toggleWordCheck(word.id, isChecked)"
              />
              <Button
                icon="pi pi-lightbulb"
                severity="warn"
                variant="text"
                rounded
                @click="toggleWordExamples(word.id)"
                class="hover:text-[#ffc107] !text-[#ffc107]"
              />
            </div>
          </div>
        </div>

        <div class="mt-6">
          <Button
            label="Drop"
            :loading="loading"
            severity="warn"
            class="!bg-[#ffc107] !border-[#ffc107] !text-black w-full !text-xl"
            @click="dropWords"
          />
        </div>
      </div>
    </div>
  </div>
</template>
