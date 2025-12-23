<script setup lang="ts">
import { WORD_CATEGORIES, WORDS } from "@/composables/constants";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Button, FloatLabel, InputText, Select } from "primevue";
import { ref, watch } from "vue";
import { db } from "../../firebase";
import { useAuth } from "@/composables/useAuth";
import type { Word } from "@/type/interfaces";

const { uid } = useAuth();

const selectedLanguage = ref<"GEO" | "DEU">("DEU");
const wordCategory = ref("word");

const words = ref<Word[]>([]);
const translations = ref<Record<string, string>>({});
const results = ref<Record<string, boolean>>({});

const fetchWords = async (category = "word") => {
  if (!uid.value) return;

  try {
    const wordsQuery = query(
      collection(db, WORDS),
      where("word_type", "==", "word"),
      where("active", "==", category === "word"),
      where("user_id", "==", uid.value)
    );

    const snapshot = await getDocs(wordsQuery);

    words.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Word, "id">),
    }));

    resetInputs();
  } catch (err) {
    console.error(err);
  }
};

const resetInputs = () => {
  translations.value = {};
  results.value = {};

  words.value.forEach((word) => {
    translations.value[word.id] = "";
  });
};

const checkAnswers = () => {
  results.value = {};

  words.value.forEach((word) => {
    const userInput = translations.value[word.id]?.trim().toLowerCase();

    let correctAnswer: string;
    if (selectedLanguage.value === "GEO") {
      correctAnswer = word.meaning;
    } else {
      correctAnswer = word.word;
    }

    results.value[word.id] =
      userInput === (correctAnswer || "").trim().toLowerCase();
  });
};

watch(selectedLanguage, () => {
  resetInputs();
});

watch(
  [uid, wordCategory],
  ([newUid, newCategory]) => {
    if (!newUid) return;
    fetchWords(newCategory);
  },
  { immediate: true }
);
</script>

<template>
  <div class="flex justify-center items-center flex-col w-full mt-10">
    <div
      class="flex flex-col bg-[#333333] p-8 rounded-[10px] border border-gray-400"
    >
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
