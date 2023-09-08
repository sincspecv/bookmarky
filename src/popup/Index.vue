<script setup lang="ts">
  import type { App } from "vue"
  import {createPinia, storeToRefs} from 'pinia'
  import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
  import Workspace from "~popup/components/Workspace.vue"


  defineOptions({
      prepare(app: App) {
          const pinia = createPinia()
          pinia.use(piniaPluginPersistedstate)

          app.use(pinia)
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
