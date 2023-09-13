<script setup lang="ts">
  import { watch, ref, nextTick } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { v4 as uuidv4 } from "uuid"
  import {storeToRefs} from "pinia";
  import { useRxStore } from "~stores/useRxStore";
  import useWorkspacesStorage from "~database";

  // Icons
  import { PlusIcon } from '@heroicons/vue/24/solid'

  const router = useRouter()
  const route = useRoute()
  const workspacesStore = useRxStore()
  const db = await useWorkspacesStorage()

  const { activeWorkspace } = storeToRefs(workspacesStore)
  const workspaces = ref(await db.workspaces.find().sort({created: "asc"}).exec())
</script>

<template>
  <div class="w-full h-full p-10 rounded-lg drop-shadow-md bg-neutral text-lg">
      <h1>Workspace Notes</h1>
  </div>
</template>

<style scoped>

</style>
