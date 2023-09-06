import { defineStore } from "pinia"
import { ref, computed } from "vue"
import useWorkspacesStorage from "~database"

import type { Ref } from "vue"
import type { Workspace, Column } from "~lib/interfaces"

export const useRxStore = defineStore("rxStore", () => {
    // Props
    const workspaces : Ref<Workspace[]> = ref([])
    const columns : Ref<Column[]> = ref([])
    const activeWorkspace: Ref<Workspace> = ref({_id: "", name: "", columns: []})
    const hasActiveWorkspace: Ref<boolean> = ref(!!activeWorkspace.value._id)
    const firstLoad : Ref<boolean> = ref(true)
    let db = null  // db is initialized in CreateWorkspace

    // Getters
    const getWorkspaces = computed(async () => {

        workspaces.value = await db.workspaces.find().exec()
        return workspaces.value
    })

    const getWorkspace = computed(() => {
        return async (workspaceId : string) : Promise<Workspace> => {
            return await db.workspaces.findOne(workspaceId).exec()
        }
    })

    const getActiveWorkspace = computed(() => {
            return activeWorkspace.value
    })

    const getColumns = computed(async () => {
        columns.value = await db.columns.find().exec()
        return columns.value
    })

    const getColumnById = computed(() => {
        return async (columnId : string) => {
            return await db.columns.findOne(columnId).exec()
        }
    })

    const getWorkspaceColumns = computed(() => {
        return async (workspace: Workspace) => {
            return await db.columns.find({
                selector: {
                    workspace: workspace._id
                }
            }).exec()
        }
    })

    // Actions
    const setActiveWorkspace = async (workspaceId : string) => {
        if(!!workspaceId) {
            activeWorkspace.value = await db.workspaces.findOne(workspaceId).exec()
        }
    }

    const setWorkspace = async (workspace : Workspace) : Promise<void> => {
        if(!!workspace._id && !!workspace.name) {
            await db.workspaces.upsert(workspace)
            workspaces.value = await db.workspaces.find().exec()
        }
    }

    const setColumn = async (column : Column) : Promise<void> => {
        if(!!column._id && !!column.title) {
            // activeWorkspace.value.columns.push(column._id)

            const _workspace = await db.workspaces.findOne(column.workspace).exec()
            _workspace.modify((data) => {
                data.columns = data.columns.concat(column._id)
                return data
            })

            // await db.workspaces.upsert(_workspace)

            await db.columns.upsert(column)
            columns.value = await db.columns.find().exec()
        }
    }

    const removeColumn = async (column : Column) : Promise<void> => {
        if(!!column._id) {
            const columnsIndex: number|boolean = columns.value.findIndex((o: Column) => o._id === column._id)

            // Remove from store
            if (columnsIndex > -1) {
                columns.value.splice(columns[columnsIndex], 1);
            }

            // Remove from DB
            await db.columns.bulkRemove([column._id])
        }
    }

    const removeWorkspace = async (workspace : Workspace) : Promise<void> => {
        const workspaceIndex = workspaces.value?.findIndex((o : Workspace) => o._id === workspace._id)

        if(workspaceIndex > -1) {
            // Remove the workspace from store and storage
            workspaces.value.splice(workspaceIndex, 1);
            await db.workspaces.bulkRemove([workspace._id])

            workspaces.value[workspaceIndex].columns?.forEach((columnId: string): void => {
                // Remove from our columns array
                const columnsIndex: number | boolean = columns.value.findIndex((o: Column) => o._id === columnId)

                if (columnsIndex > -1) {
                    removeColumn(columns[columnsIndex])
                }
            })
        }
    }

    const initDb = async () => {
        db = await useWorkspacesStorage()

        workspaces.value = await db.workspaces.find().exec()
        columns.value = await db.columns.find().exec()
    }

    const setFirstLoad = (isFirstLoad : boolean) : void => {
        firstLoad.value = !!isFirstLoad
    }

    const resetWorkspaces = () => {
        workspaces.value = []
        activeWorkspace.value = {_id: "", name: ""}
        columns.value = []
    }

    return {
        db,
        workspaces,
        columns,
        activeWorkspace,
        hasActiveWorkspace,
        firstLoad,
        setActiveWorkspace,
        setWorkspace,
        setColumn,
        setFirstLoad,
        initDb,
        removeColumn,
        removeWorkspace,
        resetWorkspaces,
        getWorkspaces,
        getWorkspace,
        getWorkspaceColumns,
        getColumnById,
        getActiveWorkspace
    }
})
