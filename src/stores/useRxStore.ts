import { defineStore } from "pinia"
import {ref, computed, inject, getCurrentInstance} from "vue"
import useWorkspacesStorage from "~database"
import { v4 as uuidv4 } from "uuid"
import { addRxPlugin } from 'rxdb';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder'

addRxPlugin(RxDBQueryBuilderPlugin)

import type { Ref } from "vue"
import type { Workspace, Column } from "~lib/App"
import type {
    RxWorkspaceDocument,
    RxColumnDocument,
} from '~lib/RxDB';

export const useRxStore = defineStore("rxStore", () => {
    // Props
    const workspaces : Ref<RxWorkspaceDocument[]> = ref([])
    const columns : Ref<RxColumnDocument[]> = ref([])
    const activeWorkspace: Ref<RxWorkspaceDocument|Workspace> = ref({_id: "", name: "", columns: []})
    const hasActiveWorkspace: Ref<boolean> = ref(!!activeWorkspace.value._id)
    const firstLoad : Ref<boolean> = ref(true)
    let db = null  // db is initialized in CreateWorkspace

    // Getters
    const getWorkspaces = computed(async () => {

        workspaces.value = await db.workspaces.find().sort({created: 'desc'}).exec()
        return workspaces.value
    })

    const getWorkspace = computed(() => {
        return async (workspaceId : string) : Promise<RxWorkspaceDocument> => {
            return await db.workspaces.findOne(workspaceId).exec()
        }
    })

    const getActiveWorkspace = computed(() => {
            return activeWorkspace.value
    })

    const getColumns = computed(async () => {
        columns.value = await db.columns.find().sort({created: "asc"}).exec()
        console.log("getColumns", columns.value)
        return columns.value
    })

    const getColumnById = computed(() => {
        return async (columnId : string) => {
            // Create a column if one isn't specified
            if(!columnId) {
                columnId = uuidv4()
                const newColumn: Column = {
                    _id: columnId,
                    workspace: getActiveWorkspace.value?._id,
                    title: "",
                    links: [],
                    created: Date.now()
                }

                await setColumn(newColumn)
            }
            return await db.columns.findOne(columnId).exec()
        }
    })

    const getWorkspaceColumns = computed(() => {
        return async (workspace: RxWorkspaceDocument) => {
            return await db.columns.find({
                selector: {
                    workspace: workspace._id
                }
            }).sort({created: "asc"}).exec()
        }
    })

    // Actions
    const setActiveWorkspace = async (workspaceId : string) => {
        // TODO: Get rid of this nonsense
        if(!db) {
            await initDb()
        }

        if(!!workspaceId) {
            activeWorkspace.value = await db.workspaces?.findOne(workspaceId).exec()
        }
    }

    const addWorkspace = async (workspace : Workspace) : Promise<void> => {
        if(!!workspace._id && !!workspace.name) {
            await db.workspaces.insert(workspace)
        }
    }

    const setColumn = async (column : RxColumnDocument|Column) : Promise<void> => {
        if(!!column._id && !!column.created) {
            const _workspace = await db.workspaces.findOne(column.workspace).exec()
            await _workspace.modify((data) => {
                const columnIndex = data.columns.findIndex((c) => c._id === column._id)

                if(columnIndex > -1) {
                    Object.assign(data.columns[columnIndex], column._id)
                } else {
                    data.columns = data.columns.concat(column._id)
                }

                return data
            })

            await db.columns.upsert(column)

            columns.value = await db.columns.find().sort({created: "asc"}).exec()
        }
    }

    const removeColumn = async (column : RxColumnDocument) : Promise<void> => {
        if(!!column._id) {
            // Find our workspace so that we can remove the column reference
            const _workspaces = await db.workspaces.find({
                selector: {
                    columns: column._id
                }
            }).exec()

            // Remove the column reference
            await _workspaces.forEach((_workspace) => {
                _workspace.modify((data) => {
                    data.columns = data.columns.toSpliced(data.columns.findIndex((c) => c === column._id), 1)
                    return data
                })
            })

            // Remove the column
            const _column = await db.columns.findOne(column._id).exec()
            _column.remove()

            // Update our columns
            columns.value = await db.columns.find().sort({created: "asc"}).exec()
        }
    }

    const removeWorkspace = async (workspace : RxWorkspaceDocument) : Promise<void> => {
        const workspaceIndex = workspaces.value?.findIndex((o : RxWorkspaceDocument) => o._id === workspace._id)

        if(workspaceIndex > -1) {
            // Remove the workspace from store and storage
            workspaces.value.splice(workspaceIndex, 1);
            await db.workspaces.bulkRemove([workspace._id])

            // Query for associated columns so that they can be removed
            const columns = await db.columns.find({
                selector: {
                    workspace: workspace._id
                }
            }).exec()

            // Remove the associated columns
            await columns.forEach((column) =>  column.remove())
        }
    }

    const initDb = async () => {
        db = await useWorkspacesStorage()

        workspaces.value = await db.workspaces.find().sort({created: "asc"}).exec()
        columns.value = await db.columns.find().sort({created: "asc"}).exec()

        await db.workspaces.$.subscribe(async (event) => {
            workspaces.value = await db.workspaces.find().sort({created: "asc"}).exec()
        })

        await db.columns.$.subscribe(async (event) => {
            columns.value = await db.columns.find().sort({created: "asc"}).exec()
        })
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
        addWorkspace,
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
        getColumns,
        getActiveWorkspace
    }
})
