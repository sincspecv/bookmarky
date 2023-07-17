<script setup lang="ts">
  import { watch, ref } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
  import { Storage } from "@plasmohq/storage"
  import { v4 as uuidv4 } from "uuid"

  const router = useRouter()
  const route = useRoute()

  const workspaceData = new Storage()
  let workspaces = await workspaceData.get("workspaces");

  const updateKey = ref(uuidv4());

  // Watch for changes and update the menu if necessary
  watch(() => route.params.id, async (toParams, prevParams) => {
      // Only update if we're coming from the add a workspace route
      if(!!toParams && prevParams === undefined) {
          workspaces = await workspaceData.get("workspaces");

          // Update the key to force Vue to reload component
          updateKey.value = uuidv4();
      }
  })


</script>

<template>
  <div class="container mx-auto">
      <div class="join rounded-box gap-[4px] py-10" role="menu" :key="updateKey">
          <router-link v-for="workspace in workspaces" :to="`/workspace/${workspace.id}`" class="join-item btn rounded-btn" role="menuitem">{{workspace.name}}</router-link>
          <router-link to="/" class="join-item btn btn-neutral rounded-btn"><font-awesome-icon icon="fas fa-plus"></font-awesome-icon><span class="sr-only">Add new workspace</span></router-link>
      </div>
  </div>
</template>

<style scoped>

</style>
