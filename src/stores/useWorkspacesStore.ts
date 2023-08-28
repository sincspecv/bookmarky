import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { useWorkspaceStorage } from "~lib/useWorkspaceStorage"
import { Storage } from "@plasmohq/storage"

import type { Workspace, Column, Link, WorkspaceCache } from "~lib/interfaces"
import type { Ref } from "vue"

const globalStorage = new Storage()
const workspaceStorage : any = useWorkspaceStorage()

export const useWorkspacesStore = defineStore("workspacesStore", () => {
    // Props
    const workspaces : Ref<Workspace[]> = ref([])
    const columns : Ref<Column[]> = ref([])
    const activeWorkspace: Ref<WorkspaceCache> = ref({_id: "", name: ""})
    const hasActiveWorkspace: Ref<boolean> = ref(!!activeWorkspace.value._id)

    // Getters


    // Actions
    const loadWorkspaces = async () : Promise<void> => {
        // First let's clear out our store to avoid duplicate data
        resetWorkspaces()

        // Get the workspaces from storage
        workspaces.value = await workspaceStorage.getWorkspaces()

        // Get columns from storage
        columns.value = await workspaceStorage.getColumns()

        // Set the active workspace
        activeWorkspace.value = await workspaceStorage.getActiveWorkspace()
    }

    const setActiveWorkspace = async (workspaceId : string) : Promise<void> => {
        await workspaceStorage.getWorkspace(workspaceId).then(async (workspace : Workspace) => {
            await workspaceStorage.setActiveWorkspace(workspace).then(() => {
                activeWorkspace.value = workspaceStorage.getActiveWorkspace()
            })
        })
    }

    const getWorkspace = async (workspaceId : string) : Promise<Workspace> => {
        if(!workspaces.value?.length) {
            await loadWorkspaces()
        }

        const workspaceIndex : number|boolean = workspaces.value?.findIndex((o : Workspace) => o._id === workspaceId)

        return workspaceIndex > -1 ? workspaces.value[workspaceIndex] : {_id: "", name: ""}
    }

    const getWorkspaceColumns = async (workspace : Workspace) : Promise<Column[]> => {
        if(!activeWorkspace.value?._id) {
            await setActiveWorkspace(workspace._id)
        }

        const workspaceColumns : Column[] = [];

        columns.value?.forEach((column : Column) => {
            if(column.workspace === activeWorkspace.value._id) {
                workspaceColumns.push(column)
            }
        })

        return workspaceColumns
    }

    /**
     * Add newly created workspace
     *
     * @param workspace
     */
    const setWorkspace = async (workspace : Workspace) : Promise<void> => {
        if(!!workspace._id && !!workspace.name) {
            await workspaceStorage.setWorkspace(workspace)
        }
    }

    const resetWorkspaces = () => {
        workspaces.value = []
        activeWorkspace.value = {_id: "", name: ""}
        columns.value = []
    }

    // Watch for changes to workspaces in storage
    // and update state when change occurs
    globalStorage.watch({
        workspaces: async (_workspaces : Workspace[]) : Promise<void> => {
            await loadWorkspaces().then(() => {
                console.log("Workspaces (Updated): ", workspaces)
            });
        },
        activeWorkspace: async (_activeWorkspace : WorkspaceCache) : Promise<void> => {
            activeWorkspace.value = await workspaceStorage.getActiveWorkspace()
        }
    })

    return {
        workspaces,
        columns,
        activeWorkspace,
        hasActiveWorkspace,
        loadWorkspaces,
        setActiveWorkspace,
        getWorkspace,
        setWorkspace,
        getWorkspaceColumns
    }
})
