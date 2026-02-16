<script setup lang="ts">
import { Avatar, ConfirmDialog, Menu, Menubar } from "primevue";
import Toast from "primevue/toast";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  ADD_WORDS_LABEL,
  ADD_WORDS_ROUTE,
  AI,
  AI_ROUTE,
  DICTIONARY_LABEL,
  DICTIONARY_ROUTE,
  DOCUMENTATION_LABEL,
  DOCUMENTATION_ROUTE,
  HOME_LABEL,
  LANGUAGES_LABEL,
  LANGUAGES_ROUTE,
  LOG_OUT_LABEL,
  SENTENCES_LABEL,
  SENTENCES_ROUTE,
  SIGN_IN_LABEL,
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
const { photoURL, uid, logout, signInWithGoogle } = useAuth();

const userMenu = ref();
const toggleUserMenu = (event: Event) => {
  userMenu.value.toggle(event);
};
const avatarSrc = computed(() => {
  return photoURL.value
    ? `https://images.weserv.nl/?url=${encodeURIComponent(photoURL.value)}`
    : "https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png";
});

const userMenuItems = ref([
  {
    label: LANGUAGES_LABEL,
    icon: "pi pi-language",
    command: () => router.push(LANGUAGES_ROUTE),
  },
  {
    label: DOCUMENTATION_LABEL,
    icon: "pi pi-book",
    command: () => router.push(DOCUMENTATION_ROUTE),
  },
  {
    separator: true,
  },
  {
    label: LOG_OUT_LABEL,
    icon: "pi pi-sign-out",
    command: async () => await logout(),
  },
]);
const notAuthenticatedUserItems = ref([
  {
    label: SIGN_IN_LABEL,
    icon: "pi pi-sign-in",
    command: async () => {
      await signInWithGoogle();
    },
  },
]);

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
]);

watch(
  () => uid.value,
  (newUid) => {
    if (newUid) setData();
  },
  { immediate: true }
);
</script>
<template>
  <div class="z-20 w-full rounded-xl bg-[#18181B] lg:min-w-225 lg:p-4">
    <Menubar :model="items">
      <template #end>
        <div class="flex items-center gap-2">
          <Avatar
            shape="circle"
            :image="
              uid
                ? avatarSrc
                : 'https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png'
            "
            @click="toggleUserMenu"
            class="cursor-pointer"
          />
          <Menu
            ref="userMenu"
            :model="uid ? userMenuItems : notAuthenticatedUserItems"
            popup
          />
        </div>
      </template>
    </Menubar>

    <Toast
      class="right-0 left-0 mx-auto w-full max-w-[100vw] px-2 [&_.p-toast-message]:max-w-full [&_.p-toast-message]:rounded-xl [&_.p-toast-message]:wrap-break-word [&_.p-toast-message]:whitespace-normal"
    />

    <ConfirmDialog class="mx-2" />

    <router-view />
  </div>
</template>
