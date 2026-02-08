<script setup lang="ts">
import { Menubar } from "primevue";
import Toast from "primevue/toast";
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  ADD_WORDS_LABEL,
  ADD_WORDS_ROUTE,
  AI,
  AI_ROUTE,
  AUTH_ROUTE,
  DICTIONARY_LABEL,
  DICTIONARY_ROUTE,
  HOME_LABEL,
  SENTENCES_LABEL,
  SENTENCES_ROUTE,
  STATISTICS_LABEL,
  STATISTICS_ROUTE,
  TESTS_LABEL,
  TRANSLATIONS,
  TRANSLATIONS_ROUTE,
  WORDS_ROUTE,
} from "./composables/constants";
import { useGlobalStore } from "./stores/GlobalStore";
import { useAuth } from "./composables/useAuth";

const router = useRouter();
const { setData } = useGlobalStore();
const { uid } = useAuth();

const items = ref([
  {
    label: HOME_LABEL,
    icon: "pi pi-home",
    command: () => router.push(WORDS_ROUTE),
  },
  {
    label: ADD_WORDS_LABEL,
    icon: "pi pi-pencil",
    command: () => router.push(ADD_WORDS_ROUTE),
  },
  {
    label: TESTS_LABEL,
    icon: "pi pi-file-edit",
    items: [
      {
        label: TRANSLATIONS,
        icon: "pi pi-pen-to-square",
        command: () => router.push(TRANSLATIONS_ROUTE),
      },
      {
        label: SENTENCES_LABEL,
        icon: "pi pi-align-justify",
        command: () => router.push(SENTENCES_ROUTE),
      },
      {
        label: AI,
        icon: "pi pi-microchip-ai",
        command: () => router.push(AI_ROUTE),
      },
    ],
  },
  {
    label: DICTIONARY_LABEL,
    icon: "pi pi-book",
    command: () => router.push(DICTIONARY_ROUTE),
  },
  {
    label: STATISTICS_LABEL,
    icon: "pi pi-chart-bar",
    command: () => router.push(STATISTICS_ROUTE),
  },
  {
    label: "Auth",
    icon: "pi pi-chart-bar",
    command: () => router.push(AUTH_ROUTE),
  },
]);

watch(
  () => uid.value,
  (newUid) => {
    if (newUid) {
      setData(); // Re-fetch when user becomes available
    }
  },
  { immediate: true } // Also runs on mount
);
</script>

<template>
  <div class="z-20 w-full rounded-xl bg-[#18181B] lg:min-w-225 lg:p-4">
    <Menubar :model="items" />
    <Toast />
    <router-view />
  </div>
</template>
