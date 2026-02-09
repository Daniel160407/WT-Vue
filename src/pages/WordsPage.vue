<script setup lang="ts">
import { onMounted, ref, watch, computed } from "vue";
import type { Word } from "@/type/interfaces";
import { db } from "../../firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { DICTIONARY, WORD_TYPE_OPTIONS } from "@/composables/constants";
import Select from "primevue/select";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import {
  ConfirmDialog,
  Dialog,
  FloatLabel,
  InputText,
  ProgressSpinner,
  Textarea,
} from "primevue";
import { useAuth } from "@/composables/useAuth";
import { useStatisticsStore } from "@/stores/useStatisticsStore";
import { useConfirm } from "primevue/useconfirm";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "@/stores/GlobalStore";
import { useWordsCrud } from "@/composables/useWordsCrud";
import { useLevelCrud } from "@/composables/useLevelCrud";
import { useDictionaryCrud } from "@/composables/useDictionaryCrud";

const { uid } = useAuth();
const stats = useStatisticsStore();
const confirm = useConfirm();
const { words, level } = storeToRefs(useGlobalStore());
const { fetchWords, fetchLevel, fetchDictionaryWords } = useGlobalStore();
const { dropWords, updateWord, deleteWord } = useWordsCrud();
const { advanceLevel } = useLevelCrud();
const { deleteDictionaryWord } = useDictionaryCrud();

const loading = ref(false);
const selectedWordType = ref<{ name: string; code: string }>(
  WORD_TYPE_OPTIONS[0] ?? { name: "Words", code: "word" }
);
const expandedWordId = ref<string | null>(null);
const checkedWordIds = ref<Set<string>>(new Set());
const showWordOperations = ref(false);
const showWordEditModal = ref(false);
const selectedWordOperationsId = ref<string>("");

const selectedWordTypeCode = computed(() => selectedWordType.value?.code);

const editingWord = ref<Word | null>(null);

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

const handleWordDoubleClick = (id: string) => {
  showWordOperations.value = !showWordOperations.value;
  selectedWordOperationsId.value = id;
};

const handleWordDelete = async (word: Word) => {
  confirm.require({
    message: "Are you sure with your decisions?",
    header: "Delete word",
    acceptProps: { label: "Delete", severity: "danger" },
    rejectProps: { label: "Cancel", severity: "secondary", outlined: true },
    accept: async () => {
      await deleteWord(word.id);
      await deleteDictionaryWord(word);
      await fetchDictionaryWords();

      words.value = words.value.filter((w) => w.id !== word.id);
      checkedWordIds.value.delete(word.id);
      await stats.decreaseWordsLearned();
      showWordOperations.value = false;
    },
    reject: () => {},
  });
};

const handleWordEdit = (word: Word) => {
  showWordEditModal.value = true;
  editingWord.value = { ...word };
};

const saveWordEdit = async (word: Word) => {
  loading.value = true;
  try {
    updateWord(word);
    const wordType = selectedWordType.value?.code ?? "";
    await fetchWords(wordType);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
    showWordEditModal.value = false;
  }
};

const handleDropWords = async () => {
  if (!hasCheckedWords.value || !uid.value || !selectedWordTypeCode.value)
    return;

  await dropWords(checkedWordIds.value, words.value.length);
  await fetchWords(selectedWordTypeCode.value);
  if (level.value) {
    await advanceLevel(level.value);
    await fetchLevel();
  }
};

const handleWordTypeChange = (value: { name: string; code: string }) => {
  if (!value?.code) return;
  fetchWords(value.code);
};

watch(words, () => {
  checkedWordIds.value.clear();
});
</script>

<template>
  <div class="flex flex-col justify-start items-center min-h-screen w-full">
    <div class="mt-10 max-w-3xl w-full p-5 bg-[#333333] rounded-2xl shadow-lg">
      <h1 class="text-[#ffc107] text-[30px] font-bold text-center mb-6">
        Level {{ level?.level }}
      </h1>

      <div
        class="flex md:flex-row md:justify-between md:items-center gap-4 mb-6"
      >
        <Select
          v-model="selectedWordType"
          :options="WORD_TYPE_OPTIONS"
          optionLabel="name"
          placeholder="Select word type"
          checkmark
          :highlightOnSelect="false"
          @update:modelValue="handleWordTypeChange"
          class="w-full flex-1 md:flex-0"
        />
        <div class="flex items-center gap-2 text-white">
          <label class="text-sm font-medium">
            <Checkbox
              v-model="allWordsChecked"
              binary
              :disabled="words.length === 0"
              class="text-yellow-400 flex-1"
            />
            Select All
          </label>
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
              <p class="text-[40px] text-center">
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
                @update:modelValue="
                  (isChecked: boolean) => toggleWordCheck(word.id, isChecked)
                "
              />
              <Button
                icon="pi pi-lightbulb"
                severity="warn"
                variant="text"
                rounded
                @click="toggleWordExamples(word.id)"
                class="hover:text-[#ffc107] text-[#ffc107]!"
              />
            </div>
            <div
              v-if="showWordOperations && word.id === selectedWordOperationsId"
              class="flex flex-col"
            >
              <ConfirmDialog></ConfirmDialog>
              <Button
                icon="pi pi-trash"
                severity="danger"
                variant="text"
                rounded
                @click="handleWordDelete(word)"
              />
              <Button
                icon="pi pi-pencil"
                variant="text"
                severity="info"
                rounded
                @click="handleWordEdit(word)"
              />
            </div>
          </div>
        </div>

        <div class="mt-6">
          <Button
            label="Drop"
            :loading="loading"
            severity="warn"
            class="bg-[#ffc107]! border-[#ffc107]! text-black! w-full text-xl!"
            @click="handleDropWords"
          />
        </div>
      </div>
    </div>
  </div>
  <Dialog
    v-model:visible="showWordEditModal"
    modal
    header="Edit word"
    class="w-full max-w-md mx-3"
  >
    <div v-if="editingWord" class="space-y-4">
      <div class="flex flex-col gap-2">
        <FloatLabel variant="in">
          <InputText v-model="editingWord.word" class="w-full" />
          <label>Word</label>
        </FloatLabel>
        <FloatLabel variant="in">
          <InputText v-model="editingWord.meaning" class="w-full" />
          <label>Meaning</label>
        </FloatLabel>
        <FloatLabel variant="in">
          <Textarea v-model="editingWord.example" class="w-full" />
          <label>Examples</label>
        </FloatLabel>
        <FloatLabel variant="in">
          <Select
            v-model="editingWord.word_type"
            :options="WORD_TYPE_OPTIONS"
            optionLabel="name"
            option-value="code"
            checkmark
            :highlightOnSelect="false"
            class="w-full"
          />
          <label>Word Category</label>
        </FloatLabel>
      </div>

      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          @click="showWordEditModal = false"
        />
        <Button
          label="Save"
          :loading="loading"
          @click="saveWordEdit(editingWord)"
        />
      </div>
    </div>
  </Dialog>
</template>
