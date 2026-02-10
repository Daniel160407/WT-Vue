import { createRouter, createWebHistory } from "vue-router";
import WordsPage from "@/pages/WordsPage.vue";
import {
  ADD_WORDS_ROUTE,
  AI_ROUTE,
  DICTIONARY_ROUTE,
  SENTENCES_ROUTE,
  STATISTICS_ROUTE,
  TRANSLATIONS_ROUTE,
  WORDS_ROUTE,
} from "./constants";
import AddWordsPage from "@/pages/AddWordsPage.vue";
import DictionaryPage from "@/pages/DictionaryPage.vue";
import TranslationsPage from "@/pages/TranslationsPage.vue";
import AIPage from "@/pages/AIPage.vue";
import StatisticsPage from "@/pages/StatisticsPage.vue";
import FillSentencesPage from "@/pages/FillSentencesPage.vue";

const routes = [
  { path: "/", redirect: WORDS_ROUTE },
  { path: WORDS_ROUTE, component: WordsPage },
  { path: ADD_WORDS_ROUTE, component: AddWordsPage },
  { path: TRANSLATIONS_ROUTE, component: TranslationsPage },
  { path: SENTENCES_ROUTE, component: FillSentencesPage },
  { path: AI_ROUTE, component: AIPage },
  { path: DICTIONARY_ROUTE, component: DictionaryPage },
  { path: STATISTICS_ROUTE, component: StatisticsPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
