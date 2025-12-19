<script setup lang="ts">
import { ref } from "vue";
import { Form } from "@primevue/forms";
import { Button, InputText, Message, Select, Textarea } from "primevue";
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

const resolver = ({ values }) => {
  const errors = {};
  if (!values.word) {
    errors.word = [{ message: "Word is required." }];
  }
  if (!values.meaning) {
    errors.meaning = [{ message: "Meaning is required." }];
  }
  if (!values.example) {
    errors.example = [{ message: "Example is required." }];
  }
  return { errors };
};

const onFormSubmit = async ({ valid }) => {
  console.log(valid);
  console.log(formData.value);
  if (valid) {
    await addDoc(collection(db, WORDS), formData.value);
  }
};
</script>
<template>
  <Form
    v-slot="$form"
    :formData
    :resolver
    :validateOnValueUpdate="false"
    :validateOnBlur="true"
    @submit="onFormSubmit"
    class="flex flex-col gap-4 w-full sm:w-56"
  >
    <div class="flex flex-col gap-1">
      <InputText
        v-model="formData.word"
        name="word"
        type="text"
        placeholder="Word"
        fluid
      />
      <Message
        v-if="$form.word?.invalid"
        severity="error"
        size="small"
        variant="simple"
        >{{ $form.word.error.message }}</Message
      >
    </div>
    <div class="flex flex-col gap-1">
      <InputText
        v-model="formData.meaning"
        name="meaning"
        type="text"
        placeholder="Meaning"
        fluid
        :formControl="{ validateOnValueUpdate: true }"
      />
      <Message
        v-if="$form.meaning?.invalid"
        severity="error"
        size="small"
        variant="simple"
        >{{ $form.meaning.error.message }}</Message
      >
    </div>
    <div class="flex flex-col gap-1">
      <Textarea
        v-model="formData.example"
        name="example"
        placeholder="Examples (One per line)"
        fluid
      />
      <Message
        v-if="$form.example?.invalid"
        severity="error"
        size="small"
        variant="simple"
        >{{ $form.example.error.message }}</Message
      >
    </div>
    <div>
      <Select
        v-model="selectedWordType"
        :options="WORD_TYPE_OPTIONS"
        optionLabel="name"
        placeholder="Select word type"
        checkmark
        :highlightOnSelect="false"
        class="w-full md:w-56"
      />
      <Select
        v-model="selectedLevel"
        :options="WORD_LEVEL_OPTIONS"
        optionLabel="name"
        placeholder="Select word level"
        checkmark
        :highlightOnSelect="false"
        class="w-full md:w-56"
        @update:model-value="
          Cookies.set('word_level', selectedLevel.code, { expires: 7 })
        "
      />
    </div>
    <Button type="submit" severity="secondary" label="Save" />
  </Form>
</template>
