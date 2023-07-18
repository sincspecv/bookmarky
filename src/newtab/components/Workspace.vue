<script setup lang="ts">
    import { reactive, watch, ref } from "vue"
    import { useRouter, useRoute } from "vue-router"
    import WorkspaceColumn from "./WorkspaceColumn"
    import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome"
    import { v4 as uuidv4 } from "uuid"
    import { Storage } from "@plasmohq/storage"
    import * as _ from "lodash-es"

    const workspaceData = new Storage()
    const workspaces = ref(await workspaceData.get("workspaces"));
    const workspace = reactive({ name: "", id: "", columns: [] })
    const updateColumns = ref(Date.now())

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
        if (!workspaces.value) {
            await workspaceData.set("workspaces", []);
        }

        // Make sure we have updated workspace data
        workspaces.value = await workspaceData.get("workspaces");

        // Check if our workspace exists
        const workspaceObject = _.find(workspaces.value, {id: route.params.id})
        const workspacesIndex = _.indexOf(workspaces.value, workspaceObject);

        // We have it. Let's set up our reactive variables
        if(workspacesIndex > -1) {
            Object.entries(workspace).forEach(_workspace => {
                const index = _.head(_workspace)

                // Get rid of null values in any arrays
                if(Array.isArray(workspaceObject[index])) {
                    workspaceObject[index].forEach((item, i) => {
                        if(item === null) {
                            workspaceObject[index].splice(i, 1);
                        }
                    })
                }

                workspace[index] = workspaceObject[index]
            })
        } else {
            redirectToCreateWorkspace()
        }

        updateColumns.value = Date.now();
    }

    const updateWorkspace = async () => {
        // Check if our workspace exists
        const workspaceObject = _.find(workspaces.value, {id: workspace.id})
        const workspacesIndex = _.indexOf(workspaces.value, workspaceObject);

        if(workspacesIndex > -1) {
            workspaces.value[workspacesIndex] = workspace
            await workspaceData.set(`workspaces`, workspaces.value)
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
            <div :key="updateColumns">
                <WorkspaceColumn :workspace="workspace" @update="updateWorkspace" v-for="column in workspace.columns" :column="column"></WorkspaceColumn>
                <WorkspaceColumn :workspace="workspace" @update="updateWorkspace" v-if="!workspace.columns.length"></WorkspaceColumn>
            </div>
        </div>
    </div>
</template>

<style scoped>

</style>
