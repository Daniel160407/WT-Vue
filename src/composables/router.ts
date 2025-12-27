import { createRouter, createWebHistory } from "vue-router";
import WordsPage from "@/pages/WordsPage.vue";
import AuthPage from "@/pages/AuthPage.vue";
import {
  ADD_WORDS_ROUTE,
  AI_ROUTE,
  AUTH_ROUTE,
  DICTIONARY_ROUTE,
  STATISTICS_ROUTE,
  TRANSLATIONS_ROUTE,
  WORDS_ROUTE,
} from "./constants";
import AddWordsPage from "@/pages/AddWordsPage.vue";
import DictionaryPage from "@/pages/DictionaryPage.vue";
import TranslationsPage from "@/pages/TranslationsPage.vue";
import AIPage from "@/pages/AIPage.vue";
import StatisticsPage from "@/pages/StatisticsPage.vue";

const routes = [
  { path: WORDS_ROUTE, component: WordsPage },
  { path: ADD_WORDS_ROUTE, component: AddWordsPage },
  { path: TRANSLATIONS_ROUTE, component: TranslationsPage },
  { path: AI_ROUTE, component: AIPage },
  { path: DICTIONARY_ROUTE, component: DictionaryPage },
  { path: STATISTICS_ROUTE, component: StatisticsPage },
  { path: AUTH_ROUTE, component: AuthPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
