<script setup lang="ts">
import { Menubar } from "primevue";
import { ref } from "vue";
import { HOME_LABEL, WORDS_PAGE } from "./composables/constants";
import Home from "./pages/WordsPage.vue";

const selectedTab = ref(WORDS_PAGE);

const items = ref([
  {
    label: HOME_LABEL,
    icon: "pi pi-home",
    command: () => (selectedTab.value = WORDS_PAGE),
  },
]);
</script>
<template>
  <div
    class="z-20 w-full rounded-xl bg-[#18181B] p-2 lg:min-w-[900px] lg:p-4 xl:max-w-[1200px]"
  >
    <Menubar :model="items" />
    <Home v-if="selectedTab === WORDS_PAGE" />
  </div>
</template>
