<script setup lang="ts">
import { ref, nextTick } from "vue";
import { Button, InputText, Message } from "primevue";
import { useToast } from "primevue/usetoast";
import { GEMINI } from "@/composables/constants";
import ResponsePendingLoader from "@/components/UI/ResponsePendingLoader.vue";
import { useStatisticsStore } from "@/stores/useStatisticsStore";
import { useGeminiChat } from "@/composables/useGeminiChat";


const { messages, waitingForResponse, sendMessage } = useGeminiChat();

const stats = useStatisticsStore();
const toast = useToast();

const prompt = ref("");

const chatContainer = ref<HTMLElement | null>(null);
const showScrollDown = ref(false);

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
  <div
    v-if="!messages.length && !waitingForResponse"
    class="flex flex-col items-center justify-center h-full text-center text-gray-400 select-none mt-5"
  >
    <div
      class="w-20 h-20 rounded-full bg-[#444444] border border-gray-500 flex items-center justify-center mb-4"
    >
      <i class="pi pi-microchip-ai text-4xl text-yellow-400"></i>
    </div>

    <h2 class="text-lg font-semibold text-gray-200">Your AI Assistant</h2>
    <p class="text-sm text-gray-400 mt-1">Ask anything to get started ✨</p>
  </div>
  <div class="relative h-[93vh] flex flex-col">
    <div
      ref="chatContainer"
      class="flex-1 overflow-y-auto px-3 pt-3 pb-24"
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
          class="ai-message max-w-[80%]"
        >
          <div v-html="message.payload"></div>
        </Message>
      </div>

      <ResponsePendingLoader v-if="waitingForResponse" />
    </div>

    <Button
      v-if="showScrollDown"
      icon="pi pi-arrow-down"
      rounded
      class="fixed bottom-24 right-4 shadow-lg z-50"
      @click="scrollToBottom"
    />

    <div
      class="fixed bottom-0 left-0 right-0 bg-[#2b2b2b] p-3 border-t border-gray-700 z-40"
    >
      <div class="flex gap-2 max-w-4xl mx-auto">
        <InputText
          v-model="prompt"
          class="flex-1 bg-[#444444] border! border-gray-500 focus:border-white text-white"
          placeholder="Ask AI for exercises"
          @keyup.enter="submit"
        />
        <Button icon="pi pi-send" @click="submit" />
      </div>
    </div>
  </div>
</template>
