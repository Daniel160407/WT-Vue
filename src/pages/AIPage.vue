<script setup lang="ts">
import { GEMINI, USER } from "@/composables/constants";
import type { MessageObj, MessageSender } from "@/type/interfaces";
import { GoogleGenAI } from "@google/genai";
import { Button, InputText, Message } from "primevue";
import { ref, nextTick } from "vue";

import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase";
import ResponsePendingLoader from "@/components/UI/ResponsePendingLoader.vue";
import { useStatisticsStore } from "@/composables/useStatisticsStore";
import { useToast } from "primevue/usetoast";

const stats = useStatisticsStore();
const toast = useToast();

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GOOGLE_AI_KEY,
});

const prompt = ref("");
const messages = ref<MessageObj[]>([]);
const waitingForResponse = ref(false);

const chatContainer = ref<HTMLElement | null>(null);
const showScrollDown = ref(false);

const messagesRef = collection(db, "messages");

const createMessage = (sender: MessageSender, payload: string): MessageObj => ({
  id: crypto.randomUUID(),
  sender,
  payload,
  created_at: Date.now(),
});

const buildPromptWithHistory = () =>
  messages.value
    .map((m) => `${m.sender === USER ? "User" : "Gemini"}: ${m.payload}`)
    .join("\n");

const submit = async () => {
  const userText = prompt.value.trim();
  if (!userText) return;

  const userMessage = createMessage(USER, userText);
  messages.value.push(userMessage);
  prompt.value = "";

  await scrollToBottom();

  try {
    waitingForResponse.value = true;

    const fullPrompt = buildPromptWithHistory() + `\nUser: ${userText}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    messages.value.push(createMessage(GEMINI, response.text ?? "No response"));
  } catch {
    messages.value.push(
      createMessage(GEMINI, "Something went wrong. Please try again...")
    );
  } finally {
    waitingForResponse.value = false;
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
    await scrollToBottom();
  }
};

const saveConversation = async () => {
  if (!messages.value.length) return;

  for (const message of messages.value) {
    await addDoc(messagesRef, {
      sender: message.sender,
      payload: message.payload,
      created_at: message.created_at,
    });
  }

  alert("Conversation saved to Firebase");
};

const handleScroll = () => {
  if (!chatContainer.value) return;
  const { scrollTop, scrollHeight, clientHeight } = chatContainer.value;
  showScrollDown.value = scrollTop + clientHeight < scrollHeight - 20;
};

const scrollToBottom = async () => {
  await nextTick();
  chatContainer.value?.scrollTo({
    top: chatContainer.value.scrollHeight,
    behavior: "smooth",
  });
};
</script>

<template>
  <div class="flex flex-col min-h-[93vh] relative">
    <div
      ref="chatContainer"
      class="flex-1 overflow-y-auto p-3"
      @scroll="handleScroll"
    >
      <div
        v-for="message in messages"
        :key="message.id"
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

    <Button
      v-if="showScrollDown"
      icon="pi pi-arrow-down"
      rounded
      class="!fixed bottom-20 right-4 shadow-lg z-50"
      @click="scrollToBottom"
    />

    <div class="flex gap-2 p-2">
      <InputText
        v-model="prompt"
        class="flex-1 !bg-[#444444] !border !border-gray-400 focus:!border-white text-white"
        placeholder="Ask AI for exercises"
        @keyup.enter="submit"
      />
      <Button icon="pi pi-send" @click="submit" />
      <Button
        icon="pi pi-save"
        severity="secondary"
        @click="saveConversation"
      />
    </div>
  </div>
</template>
