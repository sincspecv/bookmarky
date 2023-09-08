<script setup lang="ts">
  import type { App } from "vue"
  import {createPinia, storeToRefs} from 'pinia'
  import Workspace from "~popup/components/Workspace.vue"

  console.log("popup init")

  defineOptions({
      prepare(app: App) {
          app.use(createPinia())
      }
  })
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
