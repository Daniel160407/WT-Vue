import { createRouter, createWebHistory } from "vue-router";
import WordsPage from "@/pages/WordsPage.vue";
import AuthPage from "@/pages/AuthPage.vue";
import { AUTH_ROUTE, WORDS_ROUTE } from "./constants";

const routes = [
  { path: WORDS_ROUTE, component: WordsPage },
  { path: AUTH_ROUTE, component: AuthPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
