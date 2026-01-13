<script setup lang="ts">
import { useAuth } from "@/composables/useAuth";
import { Button } from "primevue";

const { user, error, signInWithGoogle, logout } = useAuth();
</script>

<template>
  <div class="min-h-16">
    <div v-if="!user">
      <Button
        icon="pi pi-google"
        label="Authorize"
        severity="contrast"
        @click="signInWithGoogle"
      />
      <p v-if="error" class="mt-2 text-sm text-red-500">{{ error }}</p>
    </div>

    <div
      v-else
      class="flex w-full flex-wrap items-center justify-between gap-3"
    >
      <Button label="Log out" severity="danger" @click="logout" />
    </div>
  </div>
</template>
