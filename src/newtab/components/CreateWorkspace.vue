<script setup lang="ts">
import { reactive } from "vue"
import { useRouter, useRoute } from "vue-router"
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome"
import { v4 as uuidv4 } from "uuid"
import { Storage } from "@plasmohq/storage"
import * as _ from "lodash-es"

const workspaceData = new Storage()
let workspaces = await workspaceData.get("workspaces");
let workspace = reactive({ name: "", id: "" })

const router = useRouter()
const route = useRoute()

workspaceData.watch({
    "workspaces": c => {
        console.log(c);
    }
})

// Check if we are loading an existing workspace
// console.log(route.params.id)

if(!!route.params.id) {
    workspace.id = route.params.id
}

// Make sure we have a workspaces array to work with
if (!workspaces) {
    await workspaceData.set("workspaces", []);
}

// Check if our workspace exists
const workspaceObject = _.find(workspaces, {id: workspace.id})
const workspacesIndex = _.indexOf(workspaces, workspaceObject);

// We have it. Let's set up our reactive variables
if(workspacesIndex > -1) {
    workspace.name = workspaceObject.name
    workspace.id = workspaceObject.id
}

// console.log(workspaces);

const addWorkspace = async () => {
    // Make sure we're not overwriting an existing workspace
    if(!workspace.id) {
        workspace.id = uuidv4();
    }

    workspaces.push(workspace);
    await workspaceData.set(`workspaces`, workspaces)
        .then(() => {
            router.push({name: "workspace", params: {id: workspace.id}, replace: true})
        })

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
