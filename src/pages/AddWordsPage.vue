<script setup lang="ts">
import { ref, watch } from "vue";
import { Form } from "@primevue/forms";
import {
  Button,
  FloatLabel,
  InputNumber,
  InputText,
  Message,
  Select,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Textarea,
} from "primevue";
import {
  GEMINI,
  WORD_LEVEL_COOKIE,
  WORD_LEVEL_OPTIONS,
  WORD_TYPE_OPTIONS,
  WORDS_CATEGORY,
} from "@/composables/constants";
import Cookies from "js-cookie";
import { useGeminiChat } from "@/composables/useGeminiChat";
import type { Word, WordForm } from "@/type/interfaces";
import { useAuth } from "@/composables/useAuth";
import { useAddWordsCrud } from "@/composables/useAddWordsCrud";
import { useGlobalStore } from "@/stores/GlobalStore";

const { uid } = useAuth();
const { messages, waitingForResponse, sendMessage } = useGeminiChat();
const { saving, addWord, addAIWord } = useAddWordsCrud();
const { fetchWords, fetchDictionaryWords } = useGlobalStore();

const parsedAIWords = ref<Word[]>([]);
const savingIndex = ref<number | null>(null);
const selectedWordType = ref({ name: "Words", code: "word" });
const selectedLevel = ref({
  name: Cookies.get(WORD_LEVEL_COOKIE) ?? "A1",
  code: Cookies.get(WORD_LEVEL_COOKIE) ?? "A1",
});

const formData = ref({
  word: "",
  meaning: "",
  example: "",
  word_type: selectedWordType.value.code,
  active: true,
  level: selectedLevel.value.code,
  language_id: Cookies.get("language_id") ?? "",
});

const AIFormData = ref({
  topic: "",
  translateFrom: "",
  translateTo: "",
  quantity: 10,
  level: "A1",
});

const resolver = ({ values }: { values: any }) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.word) errors.word = [{ message: "Word is required." }];
  if (!values.meaning) errors.meaning = [{ message: "Meaning is required." }];

  return { errors };
};

const onFormSubmit = async ({ valid }: { valid: boolean }) => {
  if (!valid || !uid.value) return;

  const payload: WordForm = {
    ...formData.value,
    user_id: uid.value,
  };
  await addWord(payload);
  await fetchWords(formData.value.word_type);
  await fetchDictionaryWords();

  formData.value.word = "";
  formData.value.meaning = "";
  formData.value.example = "";
};

const onAIFormSubmit = async () => {
  const prompt = `Generate ${AIFormData.value.quantity} words in ${AIFormData.value.translateFrom} with translations in ${AIFormData.value.translateTo} of level ${AIFormData.value.level} and about thema: ${AIFormData.value.topic}. If there is a noun, start its article with uppercase letter. Return only a JSON array in this format: [{"word": "word1", "meaning": "translation"}, ...] without any additional text, explanations, or markdown formatting.`;
  await sendMessage(prompt, false);
};

const onAIWordSave = async (word: Word, index: number) => {
  savingIndex.value = index;
  const basePayload = {
    word: word.word.trim(),
    meaning: word.meaning.trim(),
    example: "",
    level: selectedLevel.value.code,
    word_type: WORDS_CATEGORY,
    active: true,
    user_id: uid.value ?? "",
    language_id: Cookies.get("language_id") ?? "",
  };
  await addAIWord(basePayload);
  await fetchWords(formData.value.word_type);
  await fetchDictionaryWords();

  parsedAIWords.value.splice(index, 1);
};

const handleAIResponse = () => {
  for (const message of messages.value) {
    if (message.sender === GEMINI) {
      try {
        parsedAIWords.value = JSON.parse(message.payload);
      } catch {
        parsedAIWords.value = [];
      }
    }
  }
};

const generateExamples = async () => {
  const prompt = `Generate 3 example sentences in ${formData.value.level}, where the word: ${formData.value.word} is used, one per line, without any extra text`;
  await sendMessage(prompt, false);
  const examples = messages.value[messages.value.length - 1]?.payload;
  formData.value.example = examples ?? "";
};

watch(selectedWordType, (v) => (formData.value.word_type = v.code));
watch(selectedLevel, (v) => (formData.value.level = v.code));

watch(waitingForResponse, () => {
  if (!waitingForResponse.value && messages.value.length > 0) {
    handleAIResponse();
  }
});
</script>

<template>
  <div class="flex justify-center items-center mt-10">
    <div class="w-125 bg-[#333333] p-4 rounded-[10px]">
      <h1 class="text-[#ffc107] text-[30px] font-bold text-center mb-4">
        Add New Words
      </h1>

      <Tabs value="0">
        <TabList class="flex justify-center mb-6 bg-[#333333]!">
          <Tab value="0">Manual Mode</Tab>
          <Tab value="1">AI Mode</Tab>
        </TabList>

        <TabPanels class="bg-[#333333]!">
          <TabPanel value="0">
            <Form
              v-slot="$form"
              :formData
              :resolver
              :validateOnValueUpdate="false"
              :validateOnBlur="true"
              @submit="onFormSubmit"
              class="flex flex-col gap-5"
            >
              <div>
                <FloatLabel variant="on">
                  <InputText
                    v-model="formData.word"
                    name="word"
                    class="w-full"
                  />
                  <label>Word</label>
                </FloatLabel>
                <Message
                  v-if="$form.word?.invalid"
                  severity="error"
                  size="small"
                  variant="simple"
                >
                  {{ $form.word.error.message }}
                </Message>
              </div>

              <div>
                <FloatLabel variant="on">
                  <InputText
                    v-model="formData.meaning"
                    name="meaning"
                    class="w-full"
                  />
                  <label>Meaning</label>
                </FloatLabel>
                <Message
                  v-if="$form.meaning?.invalid"
                  severity="error"
                  size="small"
                  variant="simple"
                >
                  {{ $form.meaning.error.message }}
                </Message>
              </div>

              <div>
                <FloatLabel variant="on">
                  <Textarea
                    v-model="formData.example"
                    name="example"
                    rows="3"
                    class="w-full"
                  />
                  <label>Examples (one per line)</label>
                </FloatLabel>
                <Message
                  v-if="$form.example?.invalid"
                  severity="error"
                  size="small"
                  variant="simple"
                >
                  {{ $form.example.error.message }}
                </Message>
                <Button
                  label="Generate Examples"
                  :loading="waitingForResponse"
                  severity="warn"
                  class="bg-[#ffc107]! border-[#ffc107]! text-black! w-full text-l!"
                  @click="generateExamples"
                />
              </div>

              <div class="flex gap-4">
                <FloatLabel variant="on" class="flex-1">
                  <Select
                    v-model="selectedWordType"
                    :options="WORD_TYPE_OPTIONS"
                    optionLabel="name"
                    class="w-full"
                  />
                  <label>Word Type</label>
                </FloatLabel>

                <FloatLabel variant="on" class="flex-1">
                  <Select
                    v-model="selectedLevel"
                    :options="WORD_LEVEL_OPTIONS"
                    optionLabel="name"
                    class="w-full"
                    @update:model-value="
                      Cookies.set(WORD_LEVEL_COOKIE, selectedLevel.code, {
                        expires: 7,
                      })
                    "
                  />
                  <label>Word Level</label>
                </FloatLabel>
              </div>

              <Button type="submit" label="Save" :loading="saving" />
            </Form>
          </TabPanel>

          <TabPanel value="1">
            <Form
              :formData
              :resolver
              :validateOnValueUpdate="false"
              :validateOnBlur="true"
              @submit="onAIFormSubmit"
              class="flex flex-col gap-5"
            >
              <div>
                <FloatLabel variant="on">
                  <InputText
                    v-model="AIFormData.topic"
                    name="topic"
                    class="w-full"
                  />
                  <label>Topic</label>
                </FloatLabel>
              </div>

              <div>
                <FloatLabel variant="on">
                  <InputText
                    v-model="AIFormData.translateFrom"
                    name="translate_from"
                    class="w-full"
                  />
                  <label>Translate from</label>
                </FloatLabel>
              </div>

              <div>
                <FloatLabel variant="on">
                  <InputText
                    v-model="AIFormData.translateTo"
                    name="translate_to"
                    class="w-full"
                  />
                  <label>Translate to</label>
                </FloatLabel>
              </div>

              <div class="flex gap-4">
                <FloatLabel variant="on" class="flex-1">
                  <Select
                    v-model="selectedLevel"
                    :options="WORD_LEVEL_OPTIONS"
                    optionLabel="name"
                    class="w-full"
                  />
                  <label>Word Level</label>
                </FloatLabel>

                <FloatLabel variant="on" class="flex-1">
                  <InputNumber
                    v-model="AIFormData.quantity"
                    name="quantity"
                    class="w-full"
                    :min="1"
                    :useGrouping="false"
                  />
                  <label>Quantity</label>
                </FloatLabel>
              </div>

              <Button
                type="submit"
                label="Generate"
                class="bg-[#ffc107]! border-[#ffc107]! text-black! w-full text-l!"
                :loading="waitingForResponse"
              />
            </Form>

            <div class="mt-6 space-y-3">
              <div
                v-for="(word, index) in parsedAIWords"
                :key="index"
                class="flex items-center gap-4 rounded-lg bg-[#2f2f2f] p-4 shadow-sm hover:shadow-md transition"
              >
                <InputText
                  v-model="word.word"
                  placeholder="Word"
                  class="w-1/3"
                />
                <InputText
                  v-model="word.meaning"
                  placeholder="Meaning"
                  class="w-1/3"
                />
                <Button
                  label="Save"
                  icon="pi pi-check"
                  class="ml-auto"
                  :loading="saving"
                  @click="onAIWordSave(word, index)"
                />
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>
