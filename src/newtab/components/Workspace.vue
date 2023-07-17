<script setup lang="ts">
    import { reactive, watch, ref } from "vue"
    import { useRouter, useRoute } from "vue-router"
    import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome"
    import { v4 as uuidv4 } from "uuid"
    import { Storage } from "@plasmohq/storage"
    import * as _ from "lodash-es"

    const workspaceData = new Storage()
    const workspace = reactive({ name: "", id: "" })
    const updateKey = ref(uuidv4())

    const router = useRouter()
    const route = useRoute()

    workspaceData.watch({
        "workspaces": c => {
            console.log(c);
        }
    })

    // Check if we are loading an existing workspace
    if(!!route.params.id) {
        workspace.id = route.params.id
    }

    const getWorkspace = async () => {
        // Check if we are loading an existing workspace
        if(!!route.params.id) {
            workspace.id = route.params.id
        }

        let workspaces = await workspaceData.get("workspaces");

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
    }

    const addWorkspace = async () => {
        // Make sure we're not overwriting an existing workspace
        if(!workspace.id) {
            workspace.id = uuidv4();
        }

        workspaces.push(workspace);
        await workspaceData.set(`workspaces`, workspaces)
    }

    // Load our workspace
    getWorkspace();

    // Watch for our workspace id to change so that we can update the view
    watch(() => route.params.id, async (toParams, prevParams) => {
        // Update if the id param has changed
        if(!!toParams) {

            // Update the key to force Vue to reload component
            // updateKey.value = uuidv4();
            await getWorkspace();
        }
    })

</script>

<template>
    <div class="container">
        <h1 class="text-3xl my-10">{{workspace.name}}</h1>
        <div v-if="!!workspace.id">
            <h2>Workspace id: {{workspace.id}}</h2>
        </div>
    </div>
</template>

<style scoped>

</style>
