import type { MessageObj } from "@/type/interfaces";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useExerciseStore = defineStore("exerciseStore", () => {
  const translationWords = ref<any[]>([]);
  const translationUserInputs = ref<Record<string, string>>({});
  const translationResults = ref<Record<string, boolean>>({});
  const translationLanguage = ref<string>("DEU");
  const translationCategory = ref<any>(null);
  const translationCapital = ref<string>("A");

  const generatedSentences = ref<string[]>([]);
  const sentencesCorrectAnswers = ref<string[]>([]);
  const userSentencesAnswers = ref<string[]>([]);

  const AIMessages = ref<MessageObj[]>([]);

  const saveTranslationExercise = (
    words: any[],
    inputs: Record<string, string>,
    results: Record<string, boolean>,
    language: string,
    category: any,
    capital: string
  ) => {
    translationWords.value = words;
    translationUserInputs.value = inputs;
    translationResults.value = results;
    translationLanguage.value = language;
    translationCategory.value = category;
    translationCapital.value = capital;
  };

  const saveSentencesData = (
    newSentences: string[],
    newCorrectAnswers: string[],
    newUserAnswers: string[]
  ) => {
    generatedSentences.value = newSentences;
    sentencesCorrectAnswers.value = newCorrectAnswers;
    userSentencesAnswers.value = newUserAnswers;
  };

  const saveAIMessages = (messages: MessageObj[]) => {
    AIMessages.value = messages;
  };

  return {
    translationWords,
    translationUserInputs,
    translationResults,
    translationLanguage,
    translationCategory,
    translationCapital,
    generatedSentences,
    sentencesCorrectAnswers,
    userSentencesAnswers,
    AIMessages,
    
    saveTranslationExercise,
    saveSentencesData,
    saveAIMessages,
  };
});
