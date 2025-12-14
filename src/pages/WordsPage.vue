<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { Word } from "@/type/interfaces";
import { db } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { WORDS } from "@/composables/constants";
import Select from "primevue/select";

const words = ref<Word[]>([]);
const loading = ref(false);
const selectedWordType = ref<{ name: string; code: string }>();
const wordTypeOptions = ref([
  { name: "Words", code: "word" },
  { name: "Irregular Verbs", code: "irregular" },
]);

const fetchWords = async (wordType: string) => {
  loading.value = true;
  try {
    const wordsRef = collection(db, WORDS);
    const wordsQuery = query(wordsRef, where("word_type", "==", wordType));
    const wordsSnapshot = await getDocs(wordsQuery);
    words.value = wordsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Word[];
    console.log(words.value);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

watch(selectedWordType, (newVal) => {
  if (newVal) {
    fetchWords(newVal.code);
  }
});

onMounted(() => {
  selectedWordType.value = wordTypeOptions.value[0];
});
</script>

<template>
  <div class="flex justify-center items-center">
    <div>
      <h1>Level</h1>
      <Select
        v-model="selectedWordType"
        :options="wordTypeOptions"
        optionLabel="name"
        placeholder="Select word type"
        checkmark
        :highlightOnSelect="false"
        class="w-full md:w-56"
      />
    </div>
  </div>
</template>
