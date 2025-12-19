<script setup lang="ts">
import { Menubar } from "primevue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  ADD_WORDS_LABEL,
  ADD_WORDS_ROUTE,
  AUTH_ROUTE,
  HOME_LABEL,
  WORDS_ROUTE,
} from "./composables/constants";

const router = useRouter();

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
    label: "Auth",
    icon: "pi pi-chart-bar",
    command: () => router.push(AUTH_ROUTE),
  },
]);
</script>

<template>
  <div class="z-20 w-full rounded-xl bg-[#18181B] p-2 lg:min-w-[900px] lg:p-4">
    <Menubar :model="items" />
    <router-view />
  </div>
</template>
