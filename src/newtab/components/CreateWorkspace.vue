<script setup lang="ts">
import { reactive, ref, onMounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome"
import { v4 as uuidv4 } from "uuid"
import { Storage } from "@plasmohq/storage"
import * as _ from "lodash-es"

const router = useRouter()
const route = useRoute()

const workspaceData = new Storage()
let workspaces = await workspaceData.get("workspaces");
let workspace = reactive({ name: "", id: "", columns: [] })

// This is really just for debugging but might come in handy later
workspaceData.watch({
    "workspaces": c => {
        console.log(c);
    }
})

// Make sure we have a workspaces array to work with
if (!workspaces) {
    await workspaceData.set("workspaces", []);
}

// Check if our workspace exists
const workspaceObject = _.find(workspaces, {id: workspace.id})

// We have it. Let's set up our reactive variables
if(!!workspaceObject) {
    router.push({name: "workspace", params: {id: workspaceObject.id}, replace: true})
}

// Check for an already active workspace
const activeWorkspace = await workspaceData.get("activeWorkspace");
if(!!activeWorkspace) {
    router.replace({name: "workspace", params: {id: activeWorkspace.id}})
}

// Set our focus on the input on initial load
const workspaceNameInput = ref(null);
onMounted(() => {
    workspaceNameInput.value.focus();
})

const addWorkspace = async () => {
    // Make sure we have a workspace name
    if(!workspace.name) {
        return false;
    }

    // Make sure we have a workspace id
    if(!workspace.id) {
        workspace.id = uuidv4();
    }

    // Update our workspace in storage
    workspaces.push(workspace);

    workspaceData.set(`workspaces`, workspaces)
        .then(() => {
            // Set as active workspace
            workspaceData.set(`activeWorkspace`, workspace)
            router.push({name: "workspace", params: {id: workspace.id}, replace: true})
        })
}

</script>

<template>
    <div>
        <h1 class="text-3xl my-10 font-medium">Add a New Workspace</h1>
        <div v-if="!workspace.id" class="rounded-box drop-shadow-md bg-neutral p-20">
            <form @submit.prevent="addWorkspace" class="flex flex-col w-full gap-10" x-data="FormHandler">
                <label for="workspaceName" class="text-base">
                    Enter a unique name for your workspace
                </label>
                <input type="text" id="workspaceName" name="workspaceName" ref="workspaceNameInput" placeholder="Workspace Name" class="input input-lg input-bordered w-full" v-model="workspace.name" />
                <button type="submit" class="btn enabled:btn-primary disabled:btn-active" :disabled="!workspace.name">Add Workspace</button>
            </form>
        </div>
    </div>
</template>

<style scoped>

</style>
