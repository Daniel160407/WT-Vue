<script setup lang="ts">
import { ref, watch } from "vue";
import { Form } from "@primevue/forms";
import {
  Button,
  FloatLabel,
  InputText,
  Message,
  Select,
  Textarea,
} from "primevue";
import {
  WORD_LEVEL_OPTIONS,
  WORD_TYPE_OPTIONS,
  WORDS,
} from "@/composables/constants";
import Cookies from "js-cookie";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";

const selectedWordType = ref({ name: "Words", code: "word" });
const selectedLevel = ref({
  name: Cookies.get("word_level") ?? "A1",
  code: Cookies.get("word_level") ?? "A1",
});

const formData = ref({
  word: "",
  meaning: "",
  example: "",
  word_type: selectedWordType.value.code,
  active: true,
  level: selectedLevel.value.code,
  user_id: Cookies.get("uid") ?? "",
  language_id: Cookies.get("language_id") ?? "",
});

const resolver = ({ values }: { values: any }) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.word) errors.word = [{ message: "Word is required." }];
  if (!values.meaning) errors.meaning = [{ message: "Meaning is required." }];
  if (!values.example) errors.example = [{ message: "Example is required." }];

  return { errors };
};

const onFormSubmit = async ({ valid }: { valid: boolean }) => {
  if (!valid) return;
  await addDoc(collection(db, WORDS), formData.value);
};

watch(selectedWordType, (v) => (formData.value.word_type = v.code));
watch(selectedLevel, (v) => (formData.value.level = v.code));
</script>
<template>
  <div class="flex justify-center items-center mt-10">
    <Form
      v-slot="$form"
      :formData
      :resolver
      :validateOnValueUpdate="false"
      :validateOnBlur="true"
      @submit="onFormSubmit"
      class="flex flex-col gap-5 w-125 bg-[#333333] p-4 rounded-[10px]"
    >
      <h1 class="text-[#ffc107] text-[30px] font-bold text-center mb-6">
        Add New Words
      </h1>

      <div>
        <FloatLabel variant="on">
          <InputText v-model="formData.word" name="word" class="w-full" />
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
          <InputText v-model="formData.meaning" name="meaning" class="w-full" />
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
              Cookies.set('word_level', selectedLevel.code, { expires: 7 })
            "
          />
          <label>Word Level</label>
        </FloatLabel>
      </div>

      <Button type="submit" label="Save" />
    </Form>
  </div>
</template>
