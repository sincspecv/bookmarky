<script setup lang="ts">
  import type { App } from "vue"
  import Workspace from "~popup/components/Workspace.vue"
</script>

<template>
  <Suspense>
      <div class="w-[362px]">
          <h1 class="block">Welcome to Bookmarky!</h1>
          <Workspace />
      </div>
  </Suspense>
</template>

<style>
@import "../style.css";
</style>
