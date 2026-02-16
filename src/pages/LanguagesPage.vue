<script setup lang="ts">
import { useGlobalStore } from "@/stores/GlobalStore";
import type { Language } from "@/type/interfaces";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import Cookies from "js-cookie";
import router from "@/composables/router";
import {
  LANGUAGE_ID_COOKIE,
  LANGUAGE_OPTIONS,
  WORDS_ROUTE,
} from "@/composables/constants";
import { useLanguagesCrud } from "@/composables/useLanguagesCrud";
import { Dialog, Select, Button, useConfirm } from "primevue";
import { useCreateUserData } from "@/composables/useCreateUserData";
import { useAuth } from "@/composables/useAuth";

const { uid, setLanguageId, signInWithGoogle } = useAuth();
const confirm = useConfirm();
const globalStore = useGlobalStore();
const { languages, statistics } = storeToRefs(globalStore);
const { setData, fetchLanguages } = globalStore;
const {
  saving: savingLanguage,
  addLanguage,
  deleteLanguage,
} = useLanguagesCrud();
const {
  saving: savingUserData,
  createLevelForUser,
  createStatisticsForUser,
} = useCreateUserData();

const showAddLanguageModal = ref(false);
const newLanguage = ref({
  name: "",
  abbreviation: "",
});

const isSaving = computed(() => savingLanguage.value || savingUserData.value);
const statsMap = computed(() => {
  const map: Record<string | number, any> = {};
  statistics.value.forEach((stat) => {
    map[stat.language_id] = stat;
  });
  return map;
});

const handleLanguageClick = async (language: Language) => {
  Cookies.set(LANGUAGE_ID_COOKIE, language.id);
  setLanguageId(language.id);

  await setData();
  router.push(WORDS_ROUTE);
};

const onLanguageSelect = (code: string) => {
  const selected = LANGUAGE_OPTIONS.find((opt) => opt.code === code);
  if (selected) {
    newLanguage.value.name = selected.name;
    newLanguage.value.abbreviation = selected.code;
  }
};

const handleSave = async () => {
  if (!uid.value) {
    signInWithGoogle();
    return;
  }
  if (!newLanguage.value.abbreviation) return;

  try {
    const createdId = await addLanguage({
      name: newLanguage.value.name,
      abbreviation: newLanguage.value.abbreviation,
    });

    await fetchLanguages();

    const languageIdToUse =
      createdId ||
      languages.value.find(
        (lang) =>
          lang.name === newLanguage.value.name &&
          lang.abbreviation === newLanguage.value.abbreviation
      )?.id;

    if (!languageIdToUse) throw new Error("Could not retrieve Language ID");

    await createLevelForUser(uid.value, languageIdToUse);
    await createStatisticsForUser(uid.value, languageIdToUse);

    showAddLanguageModal.value = false;
    newLanguage.value = { name: "", abbreviation: "" };
  } catch (error) {
    console.error("Save failed:", error);
  }
};

const handleDeleteLanguage = (id: string) => {
  confirm.require({
    message:
      "Are you sure you want to delete this language and ALL associated data? This cannot be undone.",
    header: "Confirm Deletion",
    icon: "pi pi-exclamation-triangle",
    acceptProps: {
      label: "Delete",
      severity: "danger",
    },
    accept: async () => {
      try {
        await deleteLanguage(id);
        await fetchLanguages();

        if (Cookies.get(LANGUAGE_ID_COOKIE) === id) {
          Cookies.remove(LANGUAGE_ID_COOKIE);
          setLanguageId("");
        }
      } catch (error) {
        console.error("Deletion failed", error);
      }
    },
  });
};
</script>

<template>
  <div class="flex flex-col justify-start items-center min-h-screen w-full p-6">
    <div
      class="max-w-7xl w-full py-6 px-4 sm:px-8 bg-[#333333] rounded-2xl shadow-xl"
    >
      <h1
        class="text-[#ffc107] text-3xl font-bold text-center mb-8 tracking-tight"
      >
        Language Dashboard
      </h1>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
      >
        <button
          @click="showAddLanguageModal = true"
          class="group cursor-pointer p-6 w-full min-h-46.25 flex flex-col items-center justify-center bg-transparent border-2 border-dashed border-gray-500 rounded-xl hover:border-[#ffc107] hover:bg-[#ffc107]/5 transition-all duration-300"
        >
          <div class="flex flex-col items-center gap-3">
            <div
              class="w-12 h-12 flex items-center justify-center rounded-full bg-[#444444] group-hover:bg-[#ffc107] transition-all duration-300"
            >
              <i
                class="pi pi-plus text-xl text-gray-400 group-hover:text-black"
              ></i>
            </div>
            <span
              class="text-gray-400 font-bold uppercase tracking-widest text-[10px] group-hover:text-[#ffc107]"
            >
              New Language
            </span>
          </div>
        </button>

        <div
          v-for="language in languages"
          :key="language.id"
          class="group relative cursor-pointer w-full flex flex-col items-center bg-[#444444] border border-gray-600 rounded-xl shadow-md hover:bg-[#555555] hover:border-[#ffc107] transition-all duration-300"
        >
          <div class="flex justify-end items-start w-full">
            <Button
              icon="pi pi-trash"
              severity="danger"
              variant="text"
              rounded
              aria-label="Delete"
              class="scale-90!"
              @click="handleDeleteLanguage(language.id)"
            />
          </div>

          <div
            @click="handleLanguageClick(language)"
            class="p-6 flex flex-col items-center"
          >
            <div
              class="mb-4 p-1 bg-[#18181b] rounded-full shadow-inner ring-2 ring-[#ffc107]/20"
            >
              <img
                :src="`https://flagcdn.com/w80/${language.abbreviation.toLowerCase()}.png`"
                class="w-12 h-12 object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <h3 class="text-white font-bold text-lg mb-4">
              {{ language.name }}
            </h3>

            <div
              class="flex items-center justify-center gap-5 px-5 py-3 bg-[#18181b] rounded-lg border border-gray-700"
            >
              <div class="flex flex-col items-center gap-1" title="Words">
                <div class="w-4 h-4 flex items-center justify-center">
                  <i class="pi pi-book text-yellow-400 text-[12px]"></i>
                </div>
                <span class="text-white text-xs font-bold leading-none">
                  {{ statsMap[language.id]?.words_learned ?? 0 }}
                </span>
              </div>

              <div class="w-px h-6 bg-gray-700"></div>

              <div class="flex flex-col items-center gap-1" title="Cycles">
                <div class="w-4 h-4 flex items-center justify-center">
                  <i
                    class="pi pi-sync text-sky-400 text-[12px] animate-spin"
                  ></i>
                </div>
                <span class="text-white text-xs font-bold leading-none">
                  {{ statsMap[language.id]?.cycles ?? 0 }}
                </span>
              </div>

              <div class="w-px h-6 bg-gray-700"></div>

              <div class="flex flex-col items-center gap-1" title="Streak">
                <div class="w-4 h-4 flex items-center justify-center">
                  <i
                    class="fas fa-fire text-orange-400 text-[18px] animate-pulse"
                    :class="{
                      'animate-pulse': (statsMap[language.id]?.days ?? 0) > 0,
                    }"
                  ></i>
                </div>
                <span class="text-white text-xs font-bold leading-none">
                  {{ statsMap[language.id]?.days ?? 0 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Dialog
    v-model:visible="showAddLanguageModal"
    modal
    header="Add New Language"
    class="mx-3 w-full max-w-md"
    :pt="{
      header: {
        class: 'text-[#ffc107] font-bold',
      },
    }"
  >
    <form @submit.prevent="handleSave" class="flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <Select
          v-model="newLanguage.abbreviation"
          optionLabel="name"
          optionValue="code"
          placeholder="Search Languages"
          :options="LANGUAGE_OPTIONS"
          filter
          @update:modelValue="onLanguageSelect"
          class="w-full"
        >
          <template #option="slotProps">
            <div class="flex items-center gap-3">
              <img
                :src="`https://flagcdn.com/w40/${slotProps.option.code.toLowerCase()}.png`"
                class="w-5 h-5 rounded-full object-cover"
              />
              <span class="text-sm font-medium">{{
                slotProps.option.name
              }}</span>
            </div>
          </template>
        </Select>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <Button
          label="Cancel"
          severity="secondary"
          variant="text"
          @click="showAddLanguageModal = false"
          class="text-gray-400 hover:text-white!"
        />
        <Button
          type="submit"
          label="Save Language"
          :loading="isSaving"
          :disabled="!newLanguage.abbreviation"
          class="bg-[#ffc107]! border-[#ffc107]! text-black! font-bold!"
        />
      </div>
    </form>
  </Dialog>
</template>
