<script setup lang="ts">
    import { reactive, watch } from "vue"
    import { useRouter, useRoute } from "vue-router"
    import WorkspaceColumn from "./WorkspaceColumn"
    import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome"
    import { v4 as uuidv4 } from "uuid"
    import { Storage } from "@plasmohq/storage"
    import * as _ from "lodash-es"

    const workspaceData = new Storage()
    const workspaces = await workspaceData.get("workspaces");
    const workspace = reactive({ name: "", id: "" })

    const router = useRouter()
    const route = useRoute()

    /**
     * Redirect to the create workspace view
     */
    const redirectToCreateWorkspace = () => {
        router.push({name: "create-workspace", replace: true})
    }

    /**
     * Load all of our workspace data
     */
    const getWorkspace = async () => {
        // Make sure we have a workspace id and redirect
        // to the workspace creation view if not.
        if(!route.params.id) {
            redirectToCreateWorkspace()
        }

        // Make sure we have a workspaces array to work with
        if (!workspaces) {
            await workspaceData.set("workspaces", []);
        }

        // Check if our workspace exists
        const workspaceObject = _.find(workspaces, {id: route.params.id})
        const workspacesIndex = _.indexOf(workspaces, workspaceObject);

        // We have it. Let's set up our reactive variables
        if(workspacesIndex > -1) {
            workspace.name = workspaceObject.name
            workspace.id = workspaceObject.id
        } else {
            redirectToCreateWorkspace()
        }
    }

    const updateWorkspace = async () => {
        // Check if our workspace exists
        const workspaceObject = _.find(workspaces, {id: workspace.id})
        const workspacesIndex = _.indexOf(workspaces, workspaceObject);

        if(workspacesIndex > -1) {
            workspaces[workspacesIndex] = workspace
            await workspaceData.set(`workspaces`, workspaces)
        }
    }

    // Load our workspace
    getWorkspace();

    // Watch for our workspace id to change so that we can update the view
    watch(() => route.params.id, async (toParams, prevParams) => {
        // Update if the id param has changed
        if(!!toParams) {

            // Load our updated workspace
            await getWorkspace();
        }
    })

</script>

<template>
    <div class="container">
        <h1 class="text-3xl my-10">{{workspace.name}}</h1>
        <div v-if="!!workspace.id">
            <h2>Workspace id: {{workspace.id}}</h2>
            <WorkspaceColumn></WorkspaceColumn>
        </div>
    </div>
</template>

<style scoped>

</style>
