<script setup lang="ts">
    import { reactive, ref, onMounted } from "vue"
    import { useRouter, useRoute } from "vue-router"
    import { v4 as uuidv4 } from "uuid"
    import escape from "validator/es/lib/escape"
    import { useWorkspacesStore } from "~stores/useWorkspacesStore";
    import { useRxStore } from "~stores/useRxStore";

    import {storeToRefs} from "pinia";

    const router = useRouter()
    const route = useRoute()

    // const workspacesStore = useWorkspacesStore()
    const workspacesStore = useRxStore()

    const workspaces = workspacesStore.workspaces;

    // if(!workspaces.length) {
    //   workspacesStore.loadWorkspaces();
    // }

    // Load activeWorkspace on first load
    const activeWorkspace = await workspacesStore.getActiveWorkspace

    if(workspacesStore.firstLoad && !!activeWorkspace?._id) {
        workspacesStore.setFirstLoad(false)
        router.push({ name: "workspace", params: { id: activeWorkspace._id } })
    }

    let workspace = reactive({ _id: "", name: "", columns: [], created: 0 })

    // Set our focus on the input on initial load
    const workspaceNameInput = ref(null);

    onMounted(() => {
        workspaceNameInput.value.focus();
    })

    const addWorkspace = async () : Promise<void> => {
        // Make sure we have a workspace name
        if(!workspace.name) {
            return;
        }

        // Escape our workspace name
        workspace.name = escape(workspace.name)

        // Make sure we have a workspace id
        if(!workspace._id) {
            workspace._id = uuidv4()
        }

        // Make sure we have a created date
        if(!workspace.created) {
            workspace.created = Date.now()
        }

        // Save our workspace
        await workspacesStore.setWorkspace(workspace)
            .then(() => {
                // Set as active workspace
                workspacesStore.setActiveWorkspace(workspace._id)
                router.push({ name: "workspace", params: {id: workspace._id}, replace: true })
            })
    }
</script>

<template>
    <div>
        <h1 class="text-3xl my-10 font-medium">Add a New Workspace</h1>
        <div v-if="!workspace._id" class="rounded-box drop-shadow-md bg-neutral p-20">
            <form @submit.prevent="addWorkspace" class="flex flex-col w-full gap-10">
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
