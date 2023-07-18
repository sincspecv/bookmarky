<script setup lang="ts">
import { reactive, ref, watch, onMounted } from "vue"
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome"
import { v4 as uuidv4 } from "uuid"
import { Storage } from "@plasmohq/storage"
import * as _ from "lodash-es"
import {useRoute, useRouter} from "vue-router";

const router = useRouter()
const route = useRoute()

// Collect our props from the parent component
const props = defineProps(['workspace', 'column'])

// And our emits
const emits = defineEmits(['update'])

// Make sure we have a workspace and redirect if not
if(!props.workspace) {
    router.push({name: "create-workspace", replace: true})
}

const titleInput = ref(null)
const column = reactive({title: "", id: "", links: []})
const showInput = ref(!column.title)

// Check if we have a column
if(!!props.column) {
    Object.entries(props.column).forEach(_column => {
        const index = _.head(_column)
        column[index] = props.column[index]
    })
    
    showInput.value = false;
}

/**
 * Focus on the title input if it is visible on mount
 *
 * @see https://vuejs.org/guide/essentials/template-refs.html#accessing-the-refs
 */
onMounted(() => {
    if(showInput.value) {
        titleInput.value.focus();
    }
})

const updateTitle = () => {
    if(!column.id) {
        column.id = uuidv4()
    }

    const columnObject = _.find(props.workspace.columns, { id: column.id })
    const columnIndex = _.indexOf(props.workspace.columns, columnObject);

    if(columnIndex > -1) {
        Object.entries(props.workspace.columns).forEach(_column => {
            const index = _.head(_column)
            props.workspace.columns[index] = columnObject[index]
        })
    } else {
        props.workspace.columns.push(column);
    }

    console.log("Column change: ", column)
    console.log("Column change: ", props.workspace)

    emits('update', props.workspace)

    hideTitleInput()
}

const hideTitleInput = () => {
    // Make sure there is an actual value in the input
    if(!!column.title) {
        showInput.value = false
    }

    // Initialize column if needed
    if(!column.id) {
        column.id = uuidv4();
        props.workspace.columns.push(column);
    }
}
</script>

<template>
  <div class="w-50 p-20 rounded-box drop-shadow-md bg-neutral text-lg">
      <div class="text-xl relative">
          <div class="flex flex-row justify-between content-center"  v-if="!showInput">
              <h2>
                  {{column.title}}
              </h2>
              <div class="dropdown dropdown-bottom dropdown-end h-full">
                  <label
                      tabindex="0"
                      class="btn btn-ghost hover:btn-neutral btn-sm opacity-25 hover:opacity-100"
                  >
                      <font-awesome-icon icon="fas fa-ellipsis-v"></font-awesome-icon>
                  </label>
                  <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-content">
                      <li><a @click="showInput = !showInput"><font-awesome-icon icon="far fa-edit"></font-awesome-icon> Rename</a></li>
                      <li><a><font-awesome-icon icon="far fa-trash-alt"></font-awesome-icon> Delete</a></li>
                  </ul>
              </div>
          </div>
          <form class="relative" v-if="!!showInput" @submit.prevent="updateTitle">
              <label :for="`column-title-${column.id}`" class="sr-only">Collection title</label>
              <input
                      ref="titleInput"
                      :name="`column-title-${column.id}`"
                      :id="`column-title-${column.id}`"
                      class="input input-md input-bordered input-info w-full"
                      placeholder="Collection Title"
                      v-model="column.title"
              />
              <button
                      v-if="!!column.title"
                      type="submit"
                      class="absolute right-0 btn btn-ghost opacity-25 hover:opacity-100 hover:z-[1]"
              >
                  <font-awesome-icon icon="fas fa-sign-in-alt"></font-awesome-icon>
              </button>
          </form>
      </div>
  </div>
</template>

<style scoped>

</style>
