<script setup lang="ts">
import { reactive, ref, watch, onMounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome"
import { v4 as uuidv4 } from "uuid"
import { Storage } from "@plasmohq/storage"
import * as _ from "lodash-es"

const titleInput = ref(null)
const column = reactive({title: ""})
let showInput = !column.title


/**
 * Focus on the title input if it is visible on mount
 *
 * @see https://vuejs.org/guide/essentials/template-refs.html#accessing-the-refs
 */
onMounted(() => {
    if(showInput) {
        titleInput.value.focus();
    }
})

// Watch for showInput value to change so that we can focus on the input if needed
watch(() => showInput, (to, from) => {
    console.log(to);
    if(to) {
        titleInput.value.focus();
    }
})
</script>

<template>
  <div class="w-50 p-20 rounded-box drop-shadow-md bg-neutral text-lg">
      <div class="text-xl">
          <h2 v-if="!showInput">{{column.title}}</h2>
          <input v-if="showInput" ref="titleInput" class="input input-md input-bordered input-info w-full" placeholder="Collection Title" v-model="column.title" />
      </div>
  </div>
</template>

<style scoped>

</style>
