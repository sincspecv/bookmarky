import { Storage } from "@plasmohq/storage"
import type { Workspace, Column, Link, WorkspaceCache } from "~lib/interfaces"
import { strToChunks, chunksToString, timeOut } from "~lib/helpers";
import * as browser from "webextension-polyfill"


const storage = new Storage()

// const QUOTA_BYTES_PER_ITEM : number = browser.storage.sync.QUOTA_BYTES_PER_ITEM
const QUOTA_BYTES_PER_ITEM : number = 4000

// storage.set("workspaces", [])
// storage.set("activeWorkspace", [])
// storage.clear()
export const useWorkspaceStorage = () : object => {
    const storageObj = {
        get: async (key: string) : Promise<any> => {
            return await storage.get(key)
        },
        set: async (key: string, value: any) : Promise<any> => {
            await storage.set(key, value)
        },
        getWorkspaces: async () : Promise<Workspace[]> => {
            let workspaces : Workspace[] = await storage.get("workspaces")

            // Make sure we have a workspaces array to work with
            if (!workspaces?.length) {
                try {
                    await storage.set("workspaces", []);
                } catch (e) {
                    console.error(e)
                }
                workspaces = await storage.get("workspaces")
            }

            return workspaces
        },
        getWorkspace: async (workspaceId: string) : Promise<Workspace|boolean> => {
            const workspaces : Workspace[] = await storageObj.getWorkspaces()

            const workspaceIndex : number|boolean = workspaces.findIndex((o : Workspace) => o._id === workspaceId)

            return workspaceIndex > -1 ? workspaces[workspaceIndex] : false
        },
        setWorkspace: async (workspace: Workspace) : Promise<void> => {
            const workspaces : Workspace[] = await storageObj.getWorkspaces()
            const workspaceIndex : number|boolean = workspaces.findIndex((o : Workspace) => o._id === workspace._id)

            // If workspace is already part of the workspaces array, update it, otherwise add it
            if(workspaceIndex > -1) {
                workspaces[workspaceIndex] = Object.assign(workspaces[workspaceIndex], workspace)
            } else {
                workspaces.push(workspace)
            }

            try {
                await storage.set("workspaces", workspaces)
            } catch (e) {
                console.error(e)
            }
        },
        removeWorkspace: async (workspace: Workspace) : Promise<void> => {
            const workspaces : Workspace[] = await storageObj.getWorkspaces()
            const workspaceIndex : number|boolean = workspaces.findIndex((o : Workspace) => o._id === workspace._id)

            // Remove it
            if(workspaceIndex > -1) {
                workspaces.splice(workspaceIndex, 1)
                await storage.set("workspaces", workspaces)
            }

        },
        getActiveWorkspace: async () : Promise<WorkspaceCache> => {
            const activeWorkspace : WorkspaceCache = await storage.get("activeWorkspace")

            return !!activeWorkspace ? activeWorkspace : {_id: "", name: ""}
        },
        setActiveWorkspace: async (workspace: Workspace) : Promise<void> => {
            const columns = await storageObj.getWorkspaceColumns(workspace).then((columns) => {
                return columns.map(column => column._id)
            })

            const workspaceCache : Workspace = {
                _id: workspace._id,
                name: workspace.name,
                columns: columns
            }

            try {
                await storage.set("activeWorkspace", workspaceCache)
            } catch (e) {
                console.error(e)
            }
        },
        getActiveColumns: async () : Promise<Column[]|boolean> => {
            const workspace: WorkspaceCache = await storageObj.getActiveWorkspace()

            return !!workspace.columns ? workspace.columns : false
        },
        getColumns: async () : Promise<Column[]> => {
            let columns : Column[] = []
            let chunks : any[] = []
            let i : number = 0
            let chunk : string = ""
            do {
                chunk = await storage.get(`columns_${i}`)

                if(!!chunk) {
                    // Chunks needs to be an array of ArrayBuffers and chunk
                    // is stored in the DB as a string, so we need to use TextEncoder
                    // to convert it back to an ArrayBuffer before adding to chunks array
                    chunks.push(new TextEncoder().encode(chunk))
                }
                i++

                // Chrome storage has a limit of 120 operations per
                // minute, so we need to throttle the loop. We are using
                // 60 (low) iterations as our threshold as a safety
                if(i >= 60) {
                    await timeOut(500)
                }
            } while (!!chunk)

            if(!!chunks.length) {
                const chunksString = chunksToString(chunks)

                columns = JSON.parse(chunksString)
            }

            if(!columns?.length) {
                await storage.set(`columns_${i}`, [])
            }

            return columns
        },
        getColumn: async (columnId : String) : Promise<Column|boolean> => {
            const columns : Column[] =  await storageObj.getColumns()
            const columnIndex : number|boolean = columns.findIndex((c : Column) => c._id === columnId)

            return columnIndex > -1 ? columns[columnIndex] : false
        },
        setColumn: async (column : Column) : Promise<void> => {
            const columns : Column[] =  await storageObj.getColumns()

            const existingColumnIndex : number|boolean = columns.findIndex((o : Column) => o._id === column._id)
            if(existingColumnIndex > -1) {
                Object.assign(columns[existingColumnIndex], column)
            } else {
                columns.push(column)
            }

            const chunks = strToChunks(JSON.stringify(columns), 4096)
            // const chunks = strToChunks(JSON.stringify(columns), (QUOTA_BYTES_PER_ITEM - 100))

            for (const chunk of chunks) {
                const i = chunks.indexOf(chunk);
                await storage.set(`columns_${i}`, new TextDecoder().decode(chunk))

                // Chrome storage has a limit of 120 operations per
                // minute, so we need to throttle the loop
                if(i >= 60) {
                    await timeOut(500)
                }
            }
        },
        removeColumn: async (column : Column) : Promise<void> => {
            const columns : Column[] =  await storageObj.getColumns()

            const columnsIndex : number|boolean = columns.findIndex((o : Column) => o._id === column._id)
            if(columnsIndex > -1) {
                columns.splice(columnsIndex, 1)
                const chunks = strToChunks(JSON.stringify(columns), 4096)
                // const chunks = strToChunks(JSON.stringify(columns), (QUOTA_BYTES_PER_ITEM - 100))

                let i : number = 0

                for (const chunk of chunks) {
                    i = chunks.indexOf(chunk);
                    await storage.set(`columns_${i}`, new TextDecoder().decode(chunk))

                    // Chrome storage has a limit of 120 operations per
                    // minute, so we need to throttle the loop
                    if(i >= 60) {
                        await timeOut(500)
                    }
                }

                let chunk : string = ""
                do {
                    // We need to increment i at the beginning
                    // so that we don't overwrite the last chunk
                    // that was written
                    i++

                    chunk = await storage.get(`columns_${i}`)

                    if(!!chunk) {
                        await storage.set(`columns_${i}`, null)
                    }

                    // Chrome storage has a limit of 120 operations per
                    // minute, so we need to throttle the loop. We are using
                    // 60 (low) iterations as our threshold as a safety
                    if(i >= 60) {
                        await timeOut(500)
                    }
                } while (!!chunk)
            }
        },
        getWorkspaceColumns: async (workspace : Workspace) : Promise<Column[]> => {
            const columns : Column[] =  await storageObj.getColumns()
            const workspaceColumns : Column[] = [];

            columns.forEach((column : Column) => {
                if(column.workspace === workspace._id) {
                    workspaceColumns.push(column)
                }
            })

            return workspaceColumns
        },
        getLinks: async () : Promise<Link[]> => {
            const links : Link[] = await storage.get("links")
            if(!links?.length) {
                await storage.set("links", [])
            }

            return links
        },
        getLink: async (linkId : String) : Promise<Link|boolean> => {
            const links : Link[] =  await storageObj.getLinks()
            const linkIndex : number|boolean = links.findIndex((o : Link) => o._id === linkId)

            return linkIndex > -1 ? links[linkIndex] : false
        },
        setLink: async (link : Link) : Promise<void> => {
            const links : Link[] =  await storageObj.getLinks()

            const existingLinkIndex : number|boolean = links.findIndex((o : Link) => o._id === link._id)
            if(existingLinkIndex > -1) {
                Object.assign(links[existingLinkIndex], link)
            } else {
                links.push(link)
            }

            await storage.set("links", links)
        },
        getColumnLinks: async (columnId : String) : Promise<Link[]> => {
            const links : Link[] = await storage.get("links")
            const columnLinks : Link[] = [];

            links.forEach((link : Link) => {
                if(link.column === columnId) {
                    columnLinks.push(link)
                }
            })

            return columnLinks
        }
    }

    return storageObj
}
