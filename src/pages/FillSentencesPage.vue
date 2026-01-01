<script setup lang="ts">
import { useAuth } from "@/composables/useAuth";
import type { Word } from "@/type/interfaces";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onMounted, ref } from "vue";
import { db } from "../../firebase";
import {
  ACTIVE,
  GEMINI,
  USER_ID,
  WORD_LEVEL_COOKIE,
  WORD_TYPE,
  WORDS,
  WORDS_CATEGORY,
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
} from "primevue";

const { uid } = useAuth();
const { messages, waitingForResponse, sendMessage } = useGeminiChat();

const words = ref<Word[]>([]);
const sentences = ref<string[]>([
  "Die rote **** duftet sehr schön im Garten.",
  "Wir brauchen **** zum Trinken und Kochen.",
  "Bitte beachten Sie, dass die **** zur Abgabe des Berichts morgen endet.",
  "Die **** wärmt die Erde und lässt alles wachsen.",
  "Im Herbst verlieren die Blätter vom **** ihre Farbe.",
]);
const editedSentences = ref<string[]>([]);
const answers = ref<string[]>([]);
const correctAnswers = ref<string[]>([]);
const areAnswersChecked = ref<boolean>(false);
const showCorrectAnswers = ref<boolean>(false);

const formData = ref({
  language: "",
  level: Cookies.get(WORD_LEVEL_COOKIE) ?? "A1",
  useExistingWords: true,
  quantity: 10,
});

type SentencePart =
  | { type: "text"; text: string }
  | { type: "input"; index: number };

const fetchWords = async () => {
  if (!uid.value) return;

  const snapshot = await getDocs(
    query(
      collection(db, WORDS),
      where(WORD_TYPE, "==", WORDS_CATEGORY),
      where(ACTIVE, "==", true),
      where(USER_ID, "==", uid.value)
    )
  );

  words.value = snapshot.docs.map((d: any) => ({
    id: d.id,
    ...(d.data() as Omit<Word, "id">),
  }));
};

const generateSentences = async () => {
  const prompt = formData.value.useExistingWords
    ? `
You are a ${formData.value.language} language learning assistant.

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
You are a ${formData.value.language} language learning assistant.

TASK:
1. Generate 10 ${formData.value.level} words
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

OUTPUT FORMAT:
{
  "words": ["word1", "word2", "..."],
  "sentences": ["Sentence with ****", "Sentence with ****"]
}
`;

  await sendMessage(prompt);

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

  sentences.value = result;
  editedSentences.value = handleGeneratedSentencesEdit(result);
  answers.value = new Array(result.length).fill("");

  console.log(sentences.value);
  console.log(correctAnswers.value);
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

const resolver = (values: any) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.language) {
    errors.language = [{ message: "Language is required." }];
  }

  if (!values.level) {
    errors.level = [{ message: "Level is required." }];
  }

  if (!values.quantity) {
    errors.quantity = [{ message: "Quantity is required." }];
  }

  return { errors };
};

const onFormSubmit = async () => {
  if (uid.value && formData.value.useExistingWords) {
    await fetchWords();
  }
  await generateSentences();
};

const handleCheckAnswers = () => {
  areAnswersChecked.value = true;
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-xl font-semibold">Fill the Sentences</h1>

    <Form
      v-slot="$form"
      :formData
      :resolver
      :validateOnValueUpdate="false"
      :validateOnBlur="true"
      @submit="onFormSubmit"
      class="flex flex-col gap-4 w-full sm:w-80"
    >
      <div>
        <FloatLabel variant="on">
          <InputText v-model="formData.language" name="language" />
          <label>Language</label>
        </FloatLabel>
        <Message v-if="$form.language?.invalid" severity="error" size="small">
          {{ $form.language.error.message }}
        </Message>
      </div>

      <div>
        <FloatLabel variant="on">
          <InputText v-model="formData.level" name="level" />
          <label>Level</label>
        </FloatLabel>
        <Message v-if="$form.level?.invalid" severity="error" size="small">
          {{ $form.level.error.message }}
        </Message>
      </div>

      <div>
        <FloatLabel variant="on">
          <InputNumber v-model="formData.quantity" name="quantity" />
          <label>Quantity</label>
        </FloatLabel>
        <Message v-if="$form.quantity?.invalid" severity="error" size="small">
          {{ $form.quantity.error.message }}
        </Message>
      </div>

      <div class="flex items-center gap-2">
        <Checkbox v-model="formData.useExistingWords" binary />
        <span>Use my words</span>
      </div>

      <Button type="submit" label="Generate" />
    </Form>

    <div v-if="editedSentences.length && !waitingForResponse">
      <div class="flex gap-6">
        <div v-for="(word, i) in words" :key="i">
          <p>{{ i + 1 }}. {{ word.word }}</p>
        </div>
      </div>
      <div
        v-for="(sentence, i) in editedSentences"
        :key="i"
        class="flex gap-2 mb-3 bg-[#333333] p-4 rounded-2xl items-center border border-[#646b79]"
      >
        <p>{{ i + 1 }}.</p>
        <template v-for="(part, j) in splitSentence(sentence)" :key="j">
          <template v-if="part.type === 'input'">
            <div class="flex flex-col gap-1">
              <IconField class="relative flex items-center">
                <InputIcon
                  v-if="areAnswersChecked"
                  :class="[
                    'absolute right-3 top-1/2 -translate-y-1/2 transition-colors',
                    answers[part.index] === correctAnswers[part.index]
                      ? 'pi pi-thumbs-up text-green-500!'
                      : 'pi pi-thumbs-down text-red-500!',
                  ]"
                />

                <InputText
                  v-model="answers[part.index]"
                  class="w-32 pr-10 text-center"
                />
              </IconField>

              <Message
                v-if="
                  answers[part.index] !== correctAnswers[part.index] &&
                  showCorrectAnswers
                "
                severity="success"
                size="small"
                class="mt-1"
              >
                Correct: <strong>{{ correctAnswers[part.index] }}</strong>
              </Message>
            </div>
          </template>
          <template v-else>
            <span>{{ part.text }}</span>
          </template>
        </template>
      </div>
      <div>
        <Button label="Check Answers" @click="handleCheckAnswers" />
        <Button
          v-if="areAnswersChecked"
          label="Show correct answers"
          @click="showCorrectAnswers = true"
        />
      </div>
    </div>
  </div>
</template>
