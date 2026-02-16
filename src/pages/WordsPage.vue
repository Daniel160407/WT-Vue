<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type { Word } from "@/type/interfaces";
import {
  ADD_WORDS_ROUTE,
  WORD_LEVEL_OPTIONS,
  WORD_TYPE_OPTIONS,
} from "@/composables/constants";
import Select from "primevue/select";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import {
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
import { useGeminiChat } from "@/composables/useGeminiChat";

const { uid } = useAuth();
const stats = useStatisticsStore();
const confirm = useConfirm();
const { words, level } = storeToRefs(useGlobalStore());
const { fetchWords, fetchLevel, fetchDictionaryWords } = useGlobalStore();
const {
  saving: wordsSaving,
  dropWords,
  updateWord,
  deleteWord,
} = useWordsCrud();
const { saving: levelSaving, advanceLevel } = useLevelCrud();
const { updateDictionaryWord, deleteDictionaryWord } = useDictionaryCrud();
const { messages, sendMessage, waitingForResponse } = useGeminiChat();

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
const editingWordStartValue = ref<Word | null>(null);

const isSaving = computed(
  () => loading.value || wordsSaving.value || levelSaving.value
);

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

const getExampleList = (example?: string): string[] => {
  if (!example) return [];

  return example
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

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
      await deleteDictionaryWord(word);
      await deleteWord(word.id);
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
  editingWordStartValue.value = { ...word };
};

const saveWordEdit = async (word: Word) => {
  if (!editingWordStartValue.value || !editingWord.value) return;
  loading.value = true;
  try {
    await updateDictionaryWord(editingWordStartValue.value, editingWord.value);
    await updateWord(word);
    const wordType = selectedWordType.value?.code ?? "";
    await fetchWords(wordType);
    await fetchDictionaryWords();
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

  const areDropped = await dropWords(checkedWordIds.value, words.value.length);
  await fetchWords(selectedWordTypeCode.value);
  if (level.value && areDropped) {
    await advanceLevel(level.value);
    await fetchLevel();
  }
};

const handleWordTypeChange = (value: { name: string; code: string }) => {
  if (!value?.code) return;
  fetchWords(value.code);
};

const generateExamples = async (editingWord: Word) => {
  const prompt = `Generate 3 example sentences in ${editingWord.level}, where the word: ${editingWord.word} is used, one per line, without any extra text`;
  await sendMessage(prompt, false);
  const examples = messages.value[messages.value.length - 1]?.payload;
  editingWord.example = examples ?? "";
};

watch(words, () => {
  checkedWordIds.value.clear();
});
</script>

<template>
  <div
    class="flex flex-col justify-start items-center w-full min-h-[calc(100vh-90px)]"
  >
    <div
      class="mt-6 sm:mt-10 max-w-3xl w-full py-4 sm:py-5 px-3 sm:px-5 bg-[#333333] rounded-2xl shadow-lg"
    >
      <h1
        class="text-[#ffc107] text-2xl sm:text-[30px] font-bold text-center mb-4 sm:mb-6"
      >
        Level {{ level?.level ?? 0 }}
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
          @update:modelValue="handleWordTypeChange"
          class="w-full md:max-w-xs"
        />

        <label
          class="flex items-center gap-2 text-white text-sm md:text-base justify-start md:justify-end"
        >
          <Checkbox
            v-model="allWordsChecked"
            binary
            :disabled="words.length === 0"
            class="text-yellow-400"
          />
          Select All
        </label>
      </div>

      <div>
        <div
          v-if="isSaving && words.length === 0"
          class="flex items-center justify-center py-10"
        >
          <ProgressSpinner
            style="width: 50px; height: 50px"
            strokeWidth="3"
            fill="transparent"
            animationDuration=".5s"
          />
        </div>

        <div
          v-else-if="words.length === 0"
          class="flex flex-col items-center justify-center py-16 px-4 text-center bg-[#2a2a2a] rounded-xl border border-dashed border-gray-600"
        >
          <i class="pi pi-box text-5xl text-gray-500 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-200">No words found</h3>
          <p class="text-gray-400 mt-2 max-w-xs">
            There are no words of this category.
            <a :href="ADD_WORDS_ROUTE" class="underline text-yellow-400">Add</a>
            some words to get started!
          </p>
        </div>

        <div v-else class="flex flex-col gap-4">
          <div
            v-for="word in words"
            :key="word.id"
            @dblclick="handleWordDoubleClick(word.id)"
            class="bg-[#444444] rounded-xl p-3 sm:p-4 border border-gray-500 flex md:flex-row md:items-center hover:bg-[#555] transition-colors duration-300"
          >
            <div class="flex flex-col justify-center items-center w-full">
              <p class="text-[24px] sm:text-[32px] text-center wrap-break-word">
                {{ word.word }} –
                <span class="block sm:inline">{{ word.meaning }}</span>
              </p>
              <div
                v-if="expandedWordId === word.id && word.example"
                class="mt-3 text-gray-300 p-3 sm:p-4 bg-[#18181b] rounded-xl w-full text-sm sm:text-base"
              >
                <p class="text-[#ffc107] font-semibold mb-1">Example usages:</p>
                <ul class="list-disc pl-5 space-y-1 marker:text-[#ffc107]">
                  <li
                    v-for="(sentence, index) in getExampleList(word.example)"
                    :key="index"
                  >
                    {{ sentence }}
                  </li>
                </ul>
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
              class="flex flex-row md:flex-col items-center gap-2 mt-2 md:mt-0"
            >
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
            severity="warn"
            :loading="isSaving"
            :disabled="isSaving || words.length === 0"
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
        <Button
          label="Generate Examples"
          :loading="waitingForResponse"
          severity="warn"
          class="bg-[#ffc107]! border-[#ffc107]! text-black! w-full text-l!"
          @click="generateExamples(editingWord)"
        />
        <div class="flex gap-4">
          <FloatLabel variant="in" class="flex-1">
            <Select
              v-model="editingWord.word_type"
              optionLabel="name"
              option-value="code"
              checkmark
              :options="WORD_TYPE_OPTIONS"
              :highlightOnSelect="false"
              class="w-full"
            />
            <label>Word Category</label>
          </FloatLabel>
          <FloatLabel variant="in" class="flex-1">
            <Select
              v-model="editingWord.level"
              :options="WORD_LEVEL_OPTIONS"
              optionLabel="name"
              option-value="code"
              class="w-full"
            />
            <label>Word Level</label>
          </FloatLabel>
        </div>
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
          :loading="isSaving"
          :disabled="isSaving"
          @click="saveWordEdit(editingWord)"
        />
      </div>
    </div>
  </Dialog>
</template>
