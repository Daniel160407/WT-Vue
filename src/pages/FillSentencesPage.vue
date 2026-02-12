<script setup lang="ts">
import type { SentencePart } from "@/type/interfaces";
import { onBeforeUnmount, onMounted, ref } from "vue";
import {
  GEMINI,
  WORD_LEVEL_COOKIE,
  WORD_LEVEL_OPTIONS,
} from "@/composables/constants";
import { useGeminiChat } from "@/composables/useGeminiChat";
import Cookies from "js-cookie";
import { Form } from "@primevue/forms";
import {
  Button,
  Checkbox,
  FloatLabel,
  IconField,
  InputIcon,
  InputNumber,
  InputText,
  Message,
  Select,
} from "primevue";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "@/stores/GlobalStore";
import { useExerciseStore } from "@/stores/useExerciseStore";

const { messages, waitingForResponse, sendMessage } = useGeminiChat();
const { words } = storeToRefs(useGlobalStore());
const exerciseStore = useExerciseStore();
const { generatedSentences, sentencesCorrectAnswers, userSentencesAnswers } =
  storeToRefs(exerciseStore);
const { saveSentencesData } = exerciseStore;

const sentences = ref<string[]>([]);
const editedSentences = ref<string[]>([]);
const answers = ref<string[]>([]);
const correctAnswers = ref<string[]>([]);
const shuffledCorrectAnswers = ref<string[]>([]);
const areAnswersChecked = ref<boolean>(false);
const showCorrectAnswers = ref<boolean>(false);

const formData = ref({
  language: "",
  level: {
    name: Cookies.get(WORD_LEVEL_COOKIE) ?? "A1",
    code: Cookies.get(WORD_LEVEL_COOKIE) ?? "A1",
  },
  useExistingWords: true,
  quantity: 10,
});

const generateSentences = async () => {
  areAnswersChecked.value = false;

  const prompt = formData.value.useExistingWords
    ? `
You are a ${formData.value.level.code} ${
        formData.value.language
      } language learning assistant.

TASK:
I will give you a list of words. Generate ONE sentence per word.

Each sentence MUST:
- Be written in the same language as the words
- Contain exactly ONE missing word replaced with ****
- The missing word MUST be one of the provided words
- Use each word exactly once
- Mix the sentences (do NOT follow the input order)

IMPORTANT GRAMMAR RULES (VERY STRICT):
- The correct answer MUST be EXACTLY ONE WORD
- The correct answer MUST NOT include articles (der, die, das, ein, eine, etc.)
- Articles, if required, MUST stay in the sentence OUTSIDE the ****
- Example:
  Sentence: "Die **** für die Abgabe ist morgen."
  Correct answer: "Frist"
  ❌ Incorrect: "Die Frist"

WORD FORM RULE:
- If the sentence requires a different grammatical form of a word,
  you MUST output THAT exact form in the "words" array
- The word in the "words" array must EXACTLY match the missing word

INDEX RULE:
- The index of each word in "words" MUST match the index of its sentence

WORDS:
${words.value.map((w) => w.word).join(", ")}

OUTPUT RULES:
- Return ONLY valid JSON
- No explanations
- No markdown
- No numbering

OUTPUT FORMAT:
{
  "words": ["correctWord1", "correctWord2", "..."],
  "sentences": ["Sentence with ****", "Another sentence with ****"]
}
`
    : `
You are a ${formData.value.level.code} ${formData.value.language} language learning assistant.

TASK:
1. Generate ${formData.value.quantity} ${formData.value.level} words
2. For each word, generate ONE sentence with exactly ONE missing word
3. Replace the missing word with ****

STRICT RULES:
- The correct answer MUST be EXACTLY ONE WORD
- The correct answer MUST NOT include articles or extra words
- Articles must remain outside the **** in the sentence
- Each sentence must contain exactly ONE ****
- Words must be simple and suitable for beginners

OUTPUT RULES:
- Return ONLY valid JSON
- No explanations
- No markdown
- No numbering

OUTPUT FORMAT:
{
  "words": ["word1", "word2", "..."],
  "sentences": ["Sentence with ****", "Sentence with ****"]
}
`;

  await sendMessage(prompt, false);

  const geminiMessage = [...messages.value]
    .reverse()
    .find((m) => m.sender === GEMINI);

  if (!geminiMessage) return;

  let payloadObj: { words: string[]; sentences: string[] };
  if (typeof geminiMessage.payload === "string") {
    try {
      payloadObj = JSON.parse(geminiMessage.payload);
    } catch (e) {
      payloadObj = { words: [], sentences: [] };
    }
  } else {
    payloadObj = geminiMessage.payload;
  }

  const result = Array.isArray(payloadObj.sentences)
    ? payloadObj.sentences
    : [];
  correctAnswers.value = payloadObj.words;
  shuffledCorrectAnswers.value = shuffleArray(correctAnswers.value);

  sentences.value = result;
  editedSentences.value = handleGeneratedSentencesEdit(result);
  answers.value = new Array(result.length).fill("");
};

const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const handleGeneratedSentencesEdit = (sentences: string[]) => {
  return sentences.map((sentence, index) =>
    sentence.replace("****", `__INPUT_${index}__`)
  );
};

const splitSentence = (sentence: string): SentencePart[] => {
  const regex = /__INPUT_(\d+)__/;
  const match = sentence.match(regex);

  if (!match) {
    return [{ type: "text", text: sentence }];
  }

  const index = Number(match[1]);
  const [before, after] = sentence.split(match[0]);

  return [
    { type: "text", text: before ?? "" },
    { type: "input", index },
    { type: "text", text: after ?? "" },
  ];
};

const resolver = () => {
  const errors: Record<string, { message: string }[]> = {};

  if (!formData.value.language) {
    errors.language = [{ message: "Language is required." }];
  }

  if (!formData.value.level) {
    errors.level = [{ message: "Level is required." }];
  }

  if (!formData.value.quantity) {
    errors.quantity = [{ message: "Quantity is required." }];
  }

  return { errors };
};

const handleCheckAnswers = () => {
  areAnswersChecked.value = true;
};

const handleReset = () => {
  answers.value = new Array(sentences.value.length).fill("");

  areAnswersChecked.value = false;
  showCorrectAnswers.value = false;

  shuffledCorrectAnswers.value = shuffleArray(correctAnswers.value);
};

onMounted(() => {
  if (generatedSentences.value.length && sentencesCorrectAnswers.value.length) {
    sentences.value = [...generatedSentences.value];
    correctAnswers.value = [...sentencesCorrectAnswers.value];
    answers.value = [...userSentencesAnswers.value];

    editedSentences.value = handleGeneratedSentencesEdit(
      generatedSentences.value
    );

    shuffledCorrectAnswers.value = shuffleArray(sentencesCorrectAnswers.value);
  }
});

onBeforeUnmount(() => {
  if (sentences.value.length) {
    saveSentencesData(sentences.value, correctAnswers.value, answers.value);
  }
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex justify-center items-center flex-col">
      <h1 class="text-[#ffc107] text-[30px] font-bold text-center mb-6">
        Fill the Sentences
      </h1>

      <Form
        v-slot="$form"
        :formData
        :resolver
        :validateOnValueUpdate="false"
        :validateOnBlur="true"
        @submit="generateSentences"
        class="flex flex-col gap-4 w-full sm:w-80 p-4"
      >
        <div>
          <FloatLabel variant="on">
            <InputText
              v-model="formData.language"
              name="language"
              class="w-full"
            />
            <label>Language</label>
          </FloatLabel>
          <Message
            v-if="$form.language?.invalid"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.language.error.message }}
          </Message>
        </div>

        <div>
          <FloatLabel variant="on">
            <Select
              v-model="formData.level"
              name="level"
              optionLabel="name"
              :options="WORD_LEVEL_OPTIONS"
              class="w-full"
            />
            <label>Level</label>
          </FloatLabel>
        </div>

        <div v-if="!formData.useExistingWords">
          <FloatLabel variant="on">
            <InputNumber
              v-model="formData.quantity"
              name="quantity"
              class="w-full"
            />
            <label>Quantity</label>
          </FloatLabel>
          <Message
            v-if="$form.quantity?.invalid"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.quantity.error.message }}
          </Message>
        </div>

        <div class="flex items-center gap-2">
          <Checkbox v-model="formData.useExistingWords" binary />
          <span>Use my words</span>
        </div>

        <Button type="submit" label="Generate" :loading="waitingForResponse" />
      </Form>
    </div>
    <div v-if="editedSentences.length && !waitingForResponse">
      <div class="mb-3 bg-[#333333] p-4 rounded-2xl border border-[#646b79]">
        <div
          class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          <div
            v-for="(word, i) in shuffledCorrectAnswers"
            :key="i"
            class="bg-[#444444] p-3 rounded-2xl border border-[#646b79] text-center"
          >
            <p class="wrap-break-word">{{ i + 1 }}. {{ word }}</p>
          </div>
        </div>
      </div>

      <div
        v-for="(sentence, i) in editedSentences"
        :key="i"
        class="mb-3 bg-[#333333] p-4 rounded-2xl border border-[#646b79]"
      >
        <div
          class="flex flex-wrap items-baseline gap-x-2 gap-y-1 leading-relaxed"
        >
          <span class="font-medium">{{ i + 1 }}.</span>

          <template v-for="(part, j) in splitSentence(sentence)" :key="j">
            <template v-if="part.type === 'input'">
              <div class="inline-flex flex-col gap-1 align-baseline">
                <IconField class="relative inline-flex items-center">
                  <InputIcon
                    v-if="areAnswersChecked"
                    :class="[
                      'absolute right-2 top-1/2 -translate-y-1/2 text-sm',
                      answers[part.index]?.toLowerCase() ===
                      correctAnswers[part.index]?.toLowerCase()
                        ? 'pi pi-thumbs-up text-green-500!'
                        : 'pi pi-thumbs-down text-red-500!',
                    ]"
                  />

                  <InputText
                    v-model="answers[part.index]"
                    class="w-28 sm:w-32 pr-8 text-center inline-block"
                  />
                </IconField>

                <Message
                  v-if="
                    answers[part.index] !== correctAnswers[part.index] &&
                    showCorrectAnswers
                  "
                  severity="success"
                  size="small"
                >
                  Correct:
                  <strong>{{ correctAnswers[part.index] }}</strong>
                </Message>
              </div>
            </template>

            <template v-else>
              <span class="inline leading-relaxed">
                {{ part.text }}
              </span>
            </template>
          </template>
        </div>
      </div>

      <div class="flex flex-wrap gap-4 mt-4">
        <Button label="Check Answers" @click="handleCheckAnswers" />
        <Button
          v-if="areAnswersChecked"
          label="Show correct answers"
          @click="showCorrectAnswers = true"
        />
        <Button
          v-if="areAnswersChecked"
          icon="pi pi-sync"
          @click="handleReset"
        />
      </div>
    </div>
  </div>
</template>
