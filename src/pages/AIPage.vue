<script setup lang="ts">
import ResponsePendingLoader from "@/components/uiComponents/ResponsePendingLoader.vue";
import { GEMINI } from "@/composables/constants";
import type { MessageObj } from "@/type/interfaces";
import { GoogleGenAI } from "@google/genai";
import { Button, InputText, Message } from "primevue";
import { ref } from "vue";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GOOGLE_AI_KEY,
});

const prompt = ref("");
const messages = ref<MessageObj[]>([]);
const waitingForResponse = ref<boolean>(false);

const submit = async () => {
  const userText = prompt.value.trim();
  if (!userText) return;

  messages.value.push({
    sender: "USER",
    payload: userText,
  });

  prompt.value = "";

  try {
    waitingForResponse.value = true;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userText,
    });

    messages.value.push({
      sender: GEMINI,
      payload: response.text ?? "No response",
    });
  } catch (error) {
    console.error(error);

    messages.value.push({
      sender: GEMINI,
      payload: "Something went wrong. Please try again...",
    });
  } finally {
    waitingForResponse.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <div class="flex-1 overflow-y-auto p-3">
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="flex mb-2"
        :class="message.sender === GEMINI ? 'justify-start' : 'justify-end'"
      >
        <Message
          :severity="message.sender === GEMINI ? 'secondary' : 'contrast'"
          :class="
            message.sender === GEMINI
              ? 'bg-gray-600'
              : 'bg-yellow-500 text-black'
          "
          class="max-w-[80%]"
        >
          {{ message.payload }}
        </Message>
      </div>

      <ResponsePendingLoader v-if="waitingForResponse" />
    </div>

    <div class="flex gap-2 p-2">
      <InputText
        v-model="prompt"
        class="flex-1 !bg-[#444444] !border !border-gray-400 focus:!border-white text-white"
        placeholder="Ask AI for exercises"
        @keyup.enter="submit"
      />
      <Button icon="pi pi-send" @click="submit" />
    </div>
  </div>
</template>
