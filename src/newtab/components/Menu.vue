<script setup lang="ts">
  import { useRouter, useRoute } from 'vue-router'
  import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";

  const router = useRouter()
  const route = useRoute()
</script>

<template>
  <div class="container mx-auto">
      <div class="join rounded-box gap-[4px] p-10" role="menu">
          <router-link to="/about" class="join-item btn">Go to About</router-link>
          <router-link to="/" class="join-item btn btn-neutral rounded-btn"><font-awesome-icon icon="fas fa-plus"></font-awesome-icon><span class="sr-only">Add new workspace</span></router-link>
      </div>
  </div>
</template>

<style scoped>

</style>
