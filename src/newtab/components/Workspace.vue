<script setup lang="ts">
    import { reactive, watch, ref, onMounted, nextTick } from "vue"
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

    const workspaceNameInput = ref(null);
    const showWorkspaceNameInput = ref(false);

    const router = useRouter()
    const route = useRoute()

    // Make our dropdowns go away after clicking a menu item
    onMounted(() => {
        const dropdowns = document.querySelectorAll(".dropdown");
        dropdowns.forEach(_dropdown => {
            const menu = _dropdown.querySelector('.dropdown-content')
            menu.addEventListener('click', (e) => {
                // Make sure focus isn't already being handled by another function/method
                if(!e.target.classList.contains('handle-focus')) {
                    // Remove focus so that the dropdown disappears
                    document.activeElement.blur()
                }
            })
        })
    })

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

    const focusWorkspaceNameInput = async () => {
        await nextTick()
        workspaceNameInput.value.focus()
    }

    const updateWorkspaceName = async () => {
        await updateWorkspace()
        showWorkspaceNameInput.value = false
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
    <div class="h-full flex flex-col">
        <div class="flex flex-row justify-start gap-10 content-center items-center w-full">
            <div class="dropdown dropdown-right h-auto"  v-if="!showWorkspaceNameInput">
                <label
                    tabindex="0"
                    class="btn btn-ghost hover:btn-neutral btn-sm opacity-25 hover:opacity-100"
                >
                    <font-awesome-icon icon="fas fa-ellipsis-v"></font-awesome-icon>
                </label>
                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-content">
                    <li><a @click="showWorkspaceNameInput = !showWorkspaceNameInput; focusWorkspaceNameInput();" class="handle-focus"><font-awesome-icon icon="far fa-edit" role="button"></font-awesome-icon> Rename</a></li>
                    <li><a @click="" role="button" title="Delete workspace"><font-awesome-icon icon="far fa-trash-alt"></font-awesome-icon> Delete</a></li>
                </ul>
            </div>

            <!-- Workspace Title -->
            <h1 class="text-3xl my-10" v-if="!showWorkspaceNameInput">{{workspace.name}}</h1>
            <!-- /Workspace Title -->

            <form class="relative my-4 w-full max-w-md" v-if="!!showWorkspaceNameInput" @submit.prevent="updateWorkspaceName">
                <label :for="`workspace-name-${workspace.id}`" class="sr-only">Workspace Name</label>
                <input
                    ref="workspaceNameInput"
                    :name="`workspace-name-${workspace.id}`"
                    :id="`workspace-name-${workspace.id}`"
                    class="input input-md input-bordered input-info w-full"
                    placeholder="Workspace Name"
                    v-model="workspace.name"
                />
                <button
                    v-if="!!workspace.name"
                    type="submit"
                    class="absolute right-0 btn btn-ghost opacity-25 hover:opacity-100 hover:z-[1]"
                >
                    <font-awesome-icon icon="fas fa-sign-in-alt"></font-awesome-icon>
                </button>
            </form>
        </div>
        <div v-if="!!workspace.id" class="flex-1">
            <div :key="updateColumns" class="grid grid-cols-auto h-full py-10">
                <WorkspaceColumn :workspace="workspace" @update="updateWorkspace" v-for="column in workspace.columns" :column="column"></WorkspaceColumn>
                <WorkspaceColumn :workspace="workspace" @update="updateWorkspace" v-if="!workspace.columns.length"></WorkspaceColumn>
            </div>
        </div>
    </div>
</template>

<style scoped>

</style>
