<script setup lang="ts">
  import type { App } from "vue"
  import Workspace from "~popup/components/Workspace.vue"
</script>

<template>
  <Suspense>
      <div class="w-[362px]">
          <Workspace />
      </div>
  </Suspense>
</template>

<style>
@import "../style.css";
</style>
