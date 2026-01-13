<script setup lang="ts"></script>
<template>
  <div class="flex justify-start mb-2">
    <div
      class="relative w-10 h- bg-[radial-gradient(farthest-side,#fff_93%,#0000)_no-repeat] bg-size-[8px_8px] bg-[0_0,50%_0,100%_0] animate-loader"
    >
      <div
        class="absolute w-2 h-3 bg-white left-0 top-0 animate-loader-dot"
      ></div>
    </div>
  </div>
</template>
<style>
@keyframes l4-0 {
  0% {
    background-position:
      0 100%,
      50% 0,
      100% 0;
  }
  8%,
  42% {
    background-position:
      0 0,
      50% 0,
      100% 0;
  }
  50% {
    background-position:
      0 0,
      50% 100%,
      100% 0;
  }
  58%,
  92% {
    background-position:
      0 0,
      50% 0,
      100% 0;
  }
  100% {
    background-position:
      0 0,
      50% 0,
      100% 100%;
  }
}

@keyframes l4-1 {
  100% {
    left: calc(100% - 8px);
  }
}

@keyframes l4-2 {
  100% {
    top: -0.1px;
  }
}

.animate-loader {
  animation: l4-0 1s linear infinite alternate;
}

.animate-loader-dot {
  animation:
    l4-1 1s linear infinite alternate,
    l4-2 0.5s cubic-bezier(0, 200, 0.8, 200) infinite;
}
</style>
