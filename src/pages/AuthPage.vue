<script setup lang="ts">
import GoogleSignInButton from "@/components/uiComponents/GoogleSignInButton.vue";
</script>

<template>
  <div
    class="min-h-screen flex items-start justify-center bg-gray-50 dark:bg-zinc-900 px-4"
  >
    <div
      class="w-full mt-10 max-w-sm rounded-2xl bg-white dark:bg-zinc-800 border border-gray-400 p-6 flex flex-col gap-6"
    >
      <div class="text-center space-y-1">
        <h1 class="text-2xl font-semibold text-[#ffc107]">Welcome</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Log in or create an account
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div class="h-px flex-1 bg-gray-200 dark:bg-zinc-700"></div>
        <span class="text-xs text-gray-400 uppercase tracking-wide">
          Continue with
        </span>
        <div class="h-px flex-1 bg-gray-200 dark:bg-zinc-700"></div>
      </div>

      <div class="flex justify-center items-center">
        <GoogleSignInButton />
      </div>
    </div>
  </div>
</template>
