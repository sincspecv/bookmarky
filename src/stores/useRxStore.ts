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
    const activeWorkspace: Ref<RxWorkspaceDocument|Workspace> = ref({_id: "", name: "", columns: []})
    const firstLoad : Ref<boolean> = ref(true)
    let db = null

    const getActiveWorkspace = computed(() => {
            return activeWorkspace.value
    })

    const hasActiveWorkspace = computed(() => !!activeWorkspace.value._id)

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

    const initDb = async () => {
        db = await useWorkspacesStorage()
    }

    const setFirstLoad = (isFirstLoad : boolean) : void => {
        firstLoad.value = !!isFirstLoad
    }

    const resetWorkspaces = () => {
        activeWorkspace.value = {_id: "", name: ""}
    }

    return {
        activeWorkspace,
        hasActiveWorkspace,
        firstLoad,
        setActiveWorkspace,
        setFirstLoad,
        resetWorkspaces,
        getActiveWorkspace
    }
},
{
    persist: {
        key: "bookmarky-settings",
        paths: ["activeWorkspace"]
    }
})
