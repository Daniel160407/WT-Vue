<script setup lang="ts">
import { collection, getDocs, query, where } from "firebase/firestore";
import { FloatLabel, InputText } from "primevue";
import { onMounted, ref, watch } from "vue";
import { db } from "../../firebase";
import { DICTIONARY } from "@/composables/constants";
import { useAuth } from "@/composables/useAuth";
import type { DictionaryWord } from "@/type/interfaces";

const searchQuery = ref("");
const words = ref<DictionaryWord[]>([]);

const { uid } = useAuth();

const fetchWords = async () => {
  if (!uid.value) return;

  try {
    const snapshot = await getDocs(
      query(collection(db, DICTIONARY), where("user_id", "==", uid.value))
    );

    words.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<DictionaryWord, "id">),
    }));
  } catch (err) {
    console.error("Failed to fetch words:", err);
  }
};

watch(uid, (newUid) => {
  if (newUid) {
    fetchWords();
  }
});

onMounted(() => {
  if (uid.value) {
    fetchWords();
  }
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <FloatLabel variant="on">
      <InputText v-model="searchQuery" class="w-full" />
      <label>Search by word or meaning...</label>
    </FloatLabel>

    <p class="text-sm text-gray-400">Total words: {{ words.length }}</p>

    <div v-for="word in words" :key="word.id">
      <p>{{ word.word }} – {{ word.meaning }}</p>
      <p>{{ word.level }}</p>
    </div>
  </div>
</template>
