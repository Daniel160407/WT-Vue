<script setup lang="ts">
import { onMounted, ref, watch, computed } from "vue";
import { type DictionaryWord, type Level, type Word } from "@/type/interfaces";
import { db } from "../../firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  ACTIVE,
  DICTIONARY,
  LEVEL,
  USER_ID,
  WORD_TYPE,
  WORD_TYPE_OPTIONS,
  WORDS,
  WORDS_CATEGORY,
} from "@/composables/constants";
import Select from "primevue/select";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import { ProgressSpinner, useConfirm } from "primevue";
import { useAuth } from "@/composables/useAuth";

const { uid, loading: authLoading } = useAuth();
const confirm = useConfirm();

const words = ref<Word[]>([]);
const level = ref<Level>();
const loading = ref(false);
const selectedWordType = ref<{ name: string; code: string }>();
const expandedWordId = ref<string | null>(null);
const checkedWordIds = ref<Set<string>>(new Set());
const showWordOperations = ref(false);
const selectedWordOperationsId = ref<string>("");

const selectedWordTypeCode = computed(() => selectedWordType.value?.code);

const allWordsChecked = computed({
  get: () =>
    words.value.length > 0 && checkedWordIds.value.size === words.value.length,
  set: (value: boolean) => {
    if (value) {
      words.value.forEach((w) => checkedWordIds.value.add(w.id));
    } else {
      checkedWordIds.value.clear();
    }
  },
});

const hasCheckedWords = computed(() => checkedWordIds.value.size > 0);

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

const resetLevelAndDeleteWords = async () => {
  if (!uid.value) return;

  const batch = writeBatch(db);

  const levelSnapshot = await getDocs(collection(db, LEVEL));
  levelSnapshot.docs.forEach((d) =>
    batch.update(doc(db, LEVEL, d.id), { level: 1 })
  );

  const wordsSnapshot = await getDocs(
    query(
      collection(db, WORDS),
      where(WORD_TYPE, "==", WORDS_CATEGORY),
      where(USER_ID, "==", uid.value)
    )
  );

  wordsSnapshot.docs.forEach((d) => batch.delete(doc(db, WORDS, d.id)));

  await batch.commit();
  words.value = [];
};

const fetchLevel = async () => {
  loading.value = true;
  try {
    const snapshot = await getDocs(collection(db, LEVEL));
    if (snapshot.empty) return;

    const docSnap = snapshot.docs[0];
    const currentLevel = docSnap.data().level ?? 1;

    if (currentLevel > 5) {
      await resetLevelAndDeleteWords();
      await fetchLevel();
      return;
    }

    level.value = { id: docSnap.id, ...(docSnap.data() as Omit<Level, "id">) };
  } finally {
    loading.value = false;
  }
};

const mapWords = (snapshot: any): Word[] =>
  snapshot.docs.map((d: any) => ({
    id: d.id,
    ...(d.data() as Omit<Word, "id">),
  }));

const getWordsQuery = (wordType: string, active: boolean) =>
  query(
    collection(db, WORDS),
    where(WORD_TYPE, "==", wordType),
    where(ACTIVE, "==", active),
    where(USER_ID, "==", uid.value)
  );

const fetchWords = async (wordType: string) => {
  if (authLoading.value || !uid.value) return;
  loading.value = true;

  try {
    const snapshot = await getDocs(getWordsQuery(wordType, true));
    words.value = mapWords(snapshot);
    expandedWordId.value = null;
    await fetchLevel();
  } finally {
    loading.value = false;
  }
};

const dropWords = async () => {
  if (!hasCheckedWords.value) return;
  loading.value = true;

  try {
    const batch = writeBatch(db);
    checkedWordIds.value.forEach((id) =>
      batch.update(doc(db, WORDS, id), { active: false })
    );

    await batch.commit();
    checkedWordIds.value.clear();

    if (selectedWordTypeCode.value) {
      await fetchWords(selectedWordTypeCode.value);
    }
  } finally {
    loading.value = false;
  }
};

const handleWordDoubleClick = (id: string) => {
  showWordOperations.value = true;
  selectedWordOperationsId.value = id;
};

const handleWordDelete = async (word: Word) => {
  confirm.require({
    message: "Are you sure?",
    header: "Delete",
    acceptProps: { label: "Delete", severity: "danger" },
    rejectProps: { label: "Cancel", severity: "secondary", outlined: true },
    accept: async () => {
      // delete from WORDS
      await deleteDoc(doc(db, WORDS, word.id));

      // delete from DICTIONARY safely
      const q = query(
        collection(db, DICTIONARY),
        where("word", "==", word.word),
        where("meaning", "==", word.meaning)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        await deleteDoc(doc(db, DICTIONARY, snapshot.docs[0].id));
      }

      // update UI
      words.value = words.value.filter((w) => w.id !== word.id);
      checkedWordIds.value.delete(word.id);
      showWordOperations.value = false;
    },
    reject: () => {},
  });
};

const handleWordEdit = async (word: Word) => {};

watch([selectedWordTypeCode, uid], ([type, user]) => {
  if (type && user) fetchWords(type);
});

watch(words, () => checkedWordIds.value.clear());

onMounted(() => {
  selectedWordType.value = WORD_TYPE_OPTIONS[0];
  fetchLevel();
});
</script>

<template>
  <div class="flex flex-col justify-start items-center min-h-screen w-full">
    <div class="mt-10 max-w-3xl w-full p-2 bg-[#333333] rounded-2xl shadow-lg">
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

        <div v-else class="flex flex-col gap-4">
          <div
            v-for="word in words"
            :key="word.id"
            @dblclick="handleWordDoubleClick(word.id)"
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
            <div
              v-if="showWordOperations && word.id === selectedWordOperationsId"
            >
              <Button
                icon="pi pi-trash"
                severity="danger"
                @click="handleWordDelete(word)"
              />
              <Button
                icon="pi pi-pencil"
                severity="info"
                @click="handleWordEdit"
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
