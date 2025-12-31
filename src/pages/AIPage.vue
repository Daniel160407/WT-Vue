<script setup lang="ts">
import { ref, nextTick } from "vue";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase";

import { Button, InputText, Message } from "primevue";
import { useToast } from "primevue/usetoast";

import { GEMINI, MESSAGES } from "@/composables/constants";
import ResponsePendingLoader from "@/components/UI/ResponsePendingLoader.vue";
import { useStatisticsStore } from "@/composables/useStatisticsStore";
import { useGeminiChat } from "@/composables/useGeminiChat";

const { messages, waitingForResponse, sendMessage } = useGeminiChat();

const stats = useStatisticsStore();
const toast = useToast();

const prompt = ref("");

const chatContainer = ref<HTMLElement | null>(null);
const showScrollDown = ref(false);

const messagesRef = collection(db, MESSAGES);

const submit = async () => {
  if (!prompt.value.trim()) return;

  const text = prompt.value;
  prompt.value = "";

  await sendMessage(text);
  await scrollToBottom();

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
      class="fixed! bottom-20 right-4 shadow-lg z-50"
      @click="scrollToBottom"
    />

    <div class="flex gap-2 p-2">
      <InputText
        v-model="prompt"
        class="flex-1 bg-[#444444] !border! border-gray-400! focus:border-white! text-white"
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
