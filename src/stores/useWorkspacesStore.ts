import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { Storage } from "@plasmohq/storage"

import type { Ref } from "vue"

const storage = new Storage()

export const useWorkspacesStore = defineStore("workspaces", () => {
    // Props
    const workspaces : Ref<[]>|Ref<boolean> = ref([])
    const activeWorkspace: Ref<object>|Ref<boolean> = ref(false)

    // Getters
    const getWorkspaces = computed(async (): Promise<object[]> => {
        workspaces.value = await storage.get("workspaces")

        if (!workspaces.value) {
            await storage.set("workspaces", []);
            workspaces.value = await storage.get("workspaces")
        }

        return workspaces.value
    })

    const getActiveWorkspace = computed(async (): Promise<object|boolean> => {
        activeWorkspace.value = await storage.get("activeWorkspace")
        return activeWorkspace.value
    })

    // Actions
    const loadWorkspaces = async (): Promise<void> => {
        workspaces.value = await storage.get("workspaces")
    }
    const updateWorkspaces = async (key: string, value: any): Promise<void> => {
        await storage.set(key, value)
        workspaces.value = await storage.get("workspaces")
    }

    const setActiveWorkspace = async (workspace: object|boolean): Promise<void> => {
        console.log("Setting Active Workspace: ", workspace)
        await storage.set("activeWorkspace", workspace)
        activeWorkspace.value = await storage.get("activeWorkspace")
        console.log("Active Workspace Set: ", activeWorkspace.value)

    }

    return {
        workspaces,
        activeWorkspace,
        getWorkspaces,
        getActiveWorkspace,
        loadWorkspaces,
        updateWorkspaces,
        setActiveWorkspace
    }
})
