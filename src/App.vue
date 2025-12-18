<script setup lang="ts">
import { Menubar } from "primevue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { HOME_LABEL } from "./composables/constants";

const router = useRouter();

const items = ref([
  {
    label: HOME_LABEL,
    icon: "pi pi-home",
    command: () => router.push("/words"),
  },
  {
    label: "Auth",
    icon: "pi pi-chart-bar",
    command: () => router.push("/auth"),
  },
]);
</script>

<template>
  <div class="z-20 w-full rounded-xl bg-[#18181B] p-2 lg:min-w-[900px] lg:p-4">
    <Menubar :model="items" />
    <router-view />
  </div>
</template>
