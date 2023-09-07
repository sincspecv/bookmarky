<script setup lang="ts">
  import { watch, ref } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { v4 as uuidv4 } from "uuid"
  import {storeToRefs} from "pinia";
  import { useRxStore } from "~stores/useRxStore";
  // import { useWorkspacesStore } from "~stores/useWorkspacesStore"
  // import useWorkspacesStorage from "~database";
  // import useDatabase from "~database";

  // Icons
  import { PlusIcon } from '@heroicons/vue/24/solid'

  const router = useRouter()
  const route = useRoute()
  const workspacesStore = useRxStore()

  if(!workspacesStore.workspaces?.length) {
      await workspacesStore.initDb();
  }

  const { workspaces, activeWorkspace } = storeToRefs(workspacesStore)
  const updateKey = ref(uuidv4());

  // Watch for changes and update the menu if necessary
  // watch(() => route.params.id, async (toParams, prevParams) => {
      // Clear our active workspace so that we don't get stuck on a single
      // workspace view. This will be re-set when we load a new workspace.
      // if(!!activeWorkspace.value) {
      //     await workspacesStore.setActiveWorkspace("")
      // }

      // let renderFlag: boolean = false;
      // if(route.query.hasOwnProperty("render")) {
      //     renderFlag = !!route.query.render;
      // }
      // Only update if we're coming from the add a workspace route
      // if((!!toParams && prevParams === undefined) || renderFlag) {
      //     // workspaces.value = await workspaceData.get("workspaces");
      //
      //     // Update the key to force Vue to reload component
      //     updateKey.value = uuidv4();
      // }
  // })


</script>

<template>
  <div class="mx-auto w-full min-w-0">
      <div class="join gap-[4px] my-10 w-full carousel relative" role="menu" :key="updateKey">
          <router-link v-for="workspace in workspaces" :to="`/workspace/${workspace._id}`" class="join-item btn rounded-btn carousel-item" role="menuitem" v-html="workspace.name"></router-link>
          <router-link to="/" class="join-item btn btn-neutral rounded-btn w-[60.78px] ml-px sticky right-0 top-1/2 -translate-y-[1.5px]"><PlusIcon class="stroke-current stroke-1 w-16" /><span class="sr-only">Add new workspace</span></router-link>
      </div>
  </div>
</template>

<style scoped>

</style>
