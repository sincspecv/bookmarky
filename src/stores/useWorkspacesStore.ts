import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { useWorkspaceStorage } from "~lib/useWorkspaceStorage"
import * as browser from "webextension-polyfill"
import { byteLength } from "~lib/helpers"
import { Storage } from "@plasmohq/storage"

import type { Workspace, Column, Link, WorkspaceCache } from "~lib/interfaces"
import type { Ref } from "vue"

// const globalStorage = new Storage()
const workspaceStorage : any = useWorkspaceStorage()

const QUOTA_BYTES_PER_ITEM : number = 5000
// const QUOTA_BYTES_PER_ITEM : number = browser.storage.sync.QUOTA_BYTES_PER_ITEM

export const useWorkspacesStore = defineStore("workspacesStore", () => {
    // Props
    const workspaces : Ref<Workspace[]> = ref([])
    const columns : Ref<Column[]> = ref([])
    const activeWorkspace: Ref<Workspace> = ref({_id: "", name: "", columns: []})
    const hasActiveWorkspace: Ref<boolean> = ref(!!activeWorkspace.value._id)
    const firstLoad : Ref<boolean> = ref(true)

    // Getters
    const getWorkspace = computed(() => {
        return async (workspaceId : string) : Promise<Workspace> => {
            if(!workspaces.value?.length) {
                await loadWorkspaces()
            }

            const workspaceIndex : number|boolean = workspaces.value?.findIndex((o : Workspace) => o._id === workspaceId)

            return workspaceIndex > -1 ? workspaces.value[workspaceIndex] : {_id: "", name: ""}
        }
    })

    const getWorkspaceColumns = computed(() => {
        return async (workspace : Workspace) : Promise<Column[]> => {
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
    })

    const getActiveWorkspace = computed(async () : Promise<Workspace> => {
        return await workspaceStorage.getActiveWorkspace()
    })

    const getColumnById = computed(() => {
        return (columnId : string) => {
            return columns.value.find((column : Column) => column._id === columnId)
        }
    })

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
            await workspaceStorage.setActiveWorkspace(workspace).then(async () => {
                activeWorkspace.value = await workspaceStorage.getActiveWorkspace()
            })
        })
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

        await loadWorkspaces()
    }

    const setColumn = async (column : Column) : Promise<void> => {
        if(!!column._id) {
            if(!column.workspace) {
                column.workspace = activeWorkspace.value._id
            }

            const workspacesIndex : number|boolean = workspaces.value?.findIndex((o : Workspace) => o._id === column.workspace)
            const workspace =  workspacesIndex > -1 ? workspaces.value[workspacesIndex] : {_id: "", name: ""}

            // We have a valid workspace. Let's add our column to the
            // workspace and then commit the column to storage.
            if(!!workspace._id) {
                // Add to the workspace if it isn't already there
                if(!workspace.columns.includes(column._id)) {
                    workspace.columns.push(column._id)
                }

                // Add to our columns array
                const columnsIndex : number|boolean = columns.value.findIndex((o : Column) => o._id === column._id)
                if(columnsIndex > -1) {
                    Object.assign(columns.value[columnsIndex], column)
                } else {
                    columns.value.push(column)
                }

                // Commit to storage
                await workspaceStorage.setColumn(column).then(async () => {
                    await workspaceStorage.setWorkspace(workspace)
                })
            }
        }
    }

    const removeColumn = async (column : Column) : Promise<void> => {
        if(!!column._id) {
            const workspacesIndex : number|boolean = workspaces.value?.findIndex((o : Workspace) => o._id === column.workspace)
            const workspace =  workspacesIndex > -1 ? workspaces.value[workspacesIndex] : {_id: "", name: ""}

            // Remove from the workspace
            if(!!workspace.columns.includes(column._id)) {
                workspace.columns.splice(workspace.columns.indexOf(column._id), 1);
            }

            // Remove from our columns array
            const columnsIndex : number|boolean = columns.value.findIndex((o : Column) => o._id === column._id)
            if(columnsIndex > -1) {
                columns.value.splice(columnsIndex, 1)
            }

            console.log("Foo", column)

            // Commit to storage
            await workspaceStorage.removeColumn(column).then(async () => {
                await workspaceStorage.setWorkspace(workspace).then(async () => {
                    await loadWorkspaces()
                })
            })
        }
    }

    const removeWorkspace = async (workspace : Workspace) : Promise<void> => {
        const workspaceIndex = workspaces.value?.findIndex((o : Workspace) => o._id === workspace._id)

        if(workspaceIndex > -1) {
            workspaces.value[workspaceIndex].columns.forEach((columnId : string) : void => {
                // Remove from our columns array
                const columnsIndex : number|boolean = columns.value.findIndex((o : Column) => o._id === columnId)

                if(columnsIndex > -1) {
                    removeColumn(columns[columnsIndex])
                }
            })
            await workspaceStorage.removeWorkspace(workspaces.value[workspaceIndex]).then(async () => {
                workspaces.value.splice(workspaceIndex, 1);
                await loadWorkspaces()
            })
        }
    }

    const setFirstLoad = (isFirstLoad : boolean) : void => {
        firstLoad.value = !!isFirstLoad
    }

    const resetWorkspaces = () => {
        workspaces.value = []
        activeWorkspace.value = {_id: "", name: ""}
        columns.value = []
    }

    // Watch for changes to workspaces in storage
    // and update state when change occurs
    // globalStorage.watch({
    //     workspaces: async (_workspaces : Workspace[]) : Promise<void> => {
    //         await loadWorkspaces()
    //     }
    // })

    return {
        workspaces,
        columns,
        activeWorkspace,
        hasActiveWorkspace,
        firstLoad,
        loadWorkspaces,
        setActiveWorkspace,
        setColumn,
        setFirstLoad,
        removeColumn,
        removeWorkspace,
        resetWorkspaces,
        getWorkspace,
        setWorkspace,
        getWorkspaceColumns,
        getColumnById,
        getActiveWorkspace
    }
})
