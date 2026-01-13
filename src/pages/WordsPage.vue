<script setup lang="ts">
import { onMounted, ref, watch, computed } from "vue";
import { type Level, type Word } from "@/type/interfaces";
import { db } from "../../firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  query,
  updateDoc,
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
import {
  ConfirmDialog,
  Dialog,
  FloatLabel,
  InputText,
  ProgressSpinner,
  Textarea,
} from "primevue";
import { useToast } from "primevue/usetoast";
import { useAuth } from "@/composables/useAuth";
import { useStatisticsStore } from "@/composables/useStatisticsStore";
import { useConfirm } from "primevue/useconfirm";

const { uid, loading: authLoading } = useAuth();
const stats = useStatisticsStore();
const confirm = useConfirm();
const toast = useToast();

const words = ref<Word[]>([]);
const level = ref<Level>();
const loading = ref(false);
const selectedWordType = ref<{ name: string; code: string }>();
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

const levelDocId = ref<string | null>(null);

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

const mapWords = (snapshot: any): Word[] =>
  snapshot.docs.map((d: any) => ({
    id: d.id,
    ...(d.data() as Omit<Word, "id">),
  }));

const createWordsQuery = (wordType: string, active: boolean) =>
  query(
    collection(db, WORDS),
    where(WORD_TYPE, "==", wordType),
    where(ACTIVE, "==", active),
    where(USER_ID, "==", uid.value)
  );

const getLevelDocument = async (): Promise<{
  id: string;
  data: any;
} | null> => {
  if (!uid.value) return null;

  const snapshot = await getDocs(
    query(collection(db, LEVEL), where(USER_ID, "==", uid.value))
  );

  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  return {
    id: docSnap!.id,
    data: docSnap!.data(),
  };
};

const resetLevelAndDeleteWords = async () => {
  if (!uid.value) return;

  const levelDoc = await getLevelDocument();
  if (!levelDoc) return;

  const batch = writeBatch(db);

  batch.update(doc(db, LEVEL, levelDoc.id), { level: 1 });

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
  levelDocId.value = null;
};

const advanceLevel = async () => {
  if (!uid.value) return;

  const levelDoc = await getLevelDocument();
  if (!levelDoc) return;

  const batch = writeBatch(db);
  batch.update(doc(db, LEVEL, levelDoc.id), { level: increment(1) });
  await batch.commit();

  levelDocId.value = levelDoc.id;
  if (level.value!.level === 5) {
    await resetLevelAndDeleteWords();
    await fetchLevel();
    await stats.increaseCycles();

    const cyclesAdvancement = await stats.checkAndGetCyclesAdvancement();

    if (cyclesAdvancement) {
      toast.add({
        severity: "success",
        summary: "New cycles streak!",
        detail: cyclesAdvancement,
        life: 6000,
      });
    }
    return;
  }
  level.value!.level++;
};

const reactivateInactiveWords = async (): Promise<boolean> => {
  if (!uid.value) return false;

  const wordsSnapshot = await getDocs(
    query(
      collection(db, WORDS),
      where(USER_ID, "==", uid.value),
      where(ACTIVE, "==", false)
    )
  );

  if (wordsSnapshot.empty) return false;

  const batch = writeBatch(db);
  wordsSnapshot.docs.forEach((wordDoc) => {
    batch.update(doc(db, WORDS, wordDoc.id), { active: true });
  });

  await batch.commit();
  return true;
};

const fetchLevel = async (): Promise<void> => {
  if (!uid.value) {
    level.value = undefined;
    return;
  }

  loading.value = true;

  try {
    const levelDoc = await getLevelDocument();
    if (!levelDoc) {
      level.value = undefined;
      return;
    }

    const currentLevel = levelDoc.data.level ?? 1;

    if (currentLevel > 5) {
      await resetLevelAndDeleteWords();
      await fetchLevel();
      await stats.increaseCycles();

      const cyclesAdvancement = await stats.checkAndGetCyclesAdvancement();
      if (cyclesAdvancement) {
        toast.add({
          severity: "success",
          summary: "New cycles streak!",
          detail: cyclesAdvancement,
          life: 6000,
        });
      }
      return;
    }

    levelDocId.value = levelDoc.id;

    level.value = {
      id: levelDoc.id,
      ...(levelDoc.data as Omit<Level, "id">),
    };
  } finally {
    loading.value = false;
  }
};

const fetchWords = async (wordType: string) => {
  if (authLoading.value || !uid.value) return;

  loading.value = true;

  try {
    const snapshot = await getDocs(createWordsQuery(wordType, true));
    words.value = mapWords(snapshot);
    expandedWordId.value = null;

    if (!levelDocId.value) {
      await fetchLevel();
    }
  } finally {
    loading.value = false;
  }
};

const dropWords = async () => {
  if (!hasCheckedWords.value || !uid.value || !selectedWordTypeCode.value)
    return;

  loading.value = true;

  try {
    const batch = writeBatch(db);
    checkedWordIds.value.forEach((id) =>
      batch.update(doc(db, WORDS, id), { active: false })
    );

    await batch.commit();
    checkedWordIds.value.clear();

    const remainingWordsSnapshot = await getDocs(
      createWordsQuery(selectedWordTypeCode.value, true)
    );
    words.value = mapWords(remainingWordsSnapshot);

    if (words.value.length === 0) {
      await advanceLevel();
      const hasReactivated = await reactivateInactiveWords();

      if (hasReactivated) {
        const reactivatedWordsSnapshot = await getDocs(
          createWordsQuery(selectedWordTypeCode.value, true)
        );
        words.value = mapWords(reactivatedWordsSnapshot);
      }
    }
  } finally {
    await stats.updateDayStreak();
    const daysAdvancement = await stats.checkAndGetDayAdvancement();
    if (daysAdvancement) {
      toast.add({
        severity: "success",
        summary: "Advancement made!",
        detail: daysAdvancement,
        life: 6000,
      });
    }
    loading.value = false;
  }
};

const handleWordDelete = async (word: Word) => {
  confirm.require({
    message: "Are you sure with your decisions?",
    header: "Delete word",
    acceptProps: { label: "Delete", severity: "danger" },
    rejectProps: { label: "Cancel", severity: "secondary", outlined: true },
    accept: async () => {
      const deletePromises = [deleteDoc(doc(db, WORDS, word.id))];

      const dictionaryQuery = query(
        collection(db, DICTIONARY),
        where("word", "==", word.word),
        where("meaning", "==", word.meaning)
      );

      const snapshot = await getDocs(dictionaryQuery);
      if (!snapshot.empty) {
        deletePromises.push(
          deleteDoc(doc(db, DICTIONARY, snapshot.docs[0]!.id))
        );
      }

      await Promise.all(deletePromises);

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
    const wordRef = doc(db, WORDS, word.id);
    const { id, ...updateData } = word;
    await updateDoc(wordRef, updateData);
    const wordType = selectedWordType.value?.code ?? "";
    await fetchWords(wordType);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
    showWordEditModal.value = false;
  }
};

watch([selectedWordTypeCode, uid], ([type, user]) => {
  if (type && user) {
    fetchWords(type);
  }
});

watch(words, () => {
  checkedWordIds.value.clear();
});

onMounted(() => {
  selectedWordType.value = WORD_TYPE_OPTIONS[0];

  if (uid.value) {
    fetchLevel();
  }
});

watch(uid, (newUid) => {
  if (newUid) {
    levelDocId.value = null;
    fetchLevel();
  } else {
    levelDocId.value = null;
    level.value = undefined;
  }
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
            @click="dropWords"
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
