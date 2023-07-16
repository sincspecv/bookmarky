<script setup lang="ts">
import { reactive } from "vue"
import { useRouter, useRoute } from "vue-router"
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome"
import { v4 as uuidv4 } from "uuid"

const workspace = reactive({ name: "Workspace", id: "" })

const router = useRouter()
const route = useRoute()

// Check if we are loading an existing workspace
if(!!route.params.id) {
    workspace.id = route.params.id
}

const addWorkspace = async () => {
    // Make sure we're not overwriting an existing workspace
    if(!workspace.id) {
        workspace.id = uuidv4();
    }
    console.log("Name: ", workspace.name);
    console.log("ID: ", workspace.id);
}
</script>

<template>
    <div class="container">
        <h1 class="text-3xl my-10">Workspace</h1>
        <div v-if="!workspace.id" class="rounded-box drop-shadow-md bg-neutral p-20">
            <h2 class="text-2xl mb-10">Add a New Workspace</h2>
            <form @submit.prevent="addWorkspace" class="flex flex-col w-full gap-10" x-data="FormHandler">
                <label for="workspaceName" class="text-base">
                    Enter a unique name for your workspace
                </label>
                <input type="text" id="workspaceName" name="workspaceName"  placeholder="Workspace Name" class="input input-bordered w-full" v-model="workspace.name" />
                <button type="submit" class="btn btn-primary">Add Workspace</button>
            </form>
        </div>
        <div v-if="!!workspace.id">
            <h2>Workspace id: {{workspace.id}}</h2>
        </div>
    </div>
</template>

<style scoped>

</style>
