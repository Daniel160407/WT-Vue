import { ref } from "vue";
import { GoogleGenAI } from "@google/genai";
import { GEMINI, GEMINI_MODEL, USER } from "@/composables/constants";
import type { MessageObj, MessageSender } from "@/type/interfaces";

export function useGeminiChat() {
  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GOOGLE_AI_KEY,
  });

  const messages = ref<MessageObj[]>([]);
  const waitingForResponse = ref(false);

  const createMessage = (
    sender: MessageSender,
    payload: string
  ): MessageObj => ({
    id: crypto.randomUUID(),
    sender,
    payload,
    created_at: Date.now(),
  });

  const buildPromptWithHistory = () =>
    messages.value
      .map((m) => `${m.sender === USER ? USER : GEMINI}: ${m.payload}`)
      .join("\n");

  const sendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    messages.value.push(createMessage(USER, trimmed));

    try {
      waitingForResponse.value = true;

      const fullPrompt = buildPromptWithHistory();
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: fullPrompt,
      });

      messages.value.push(
        createMessage(GEMINI, response.text ?? "No response")
      );
    } catch (err) {
      console.error(err);
      messages.value.push(
        createMessage(GEMINI, "Server is busy. Please try again later...")
      );
    } finally {
      waitingForResponse.value = false;
    }
  };

  return {
    messages,
    waitingForResponse,
    sendMessage,
  };
}
