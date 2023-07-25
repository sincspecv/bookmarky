import { Storage } from "@plasmohq/storage"
import type { Workspace, Column, Link, WorkspaceCache } from "~lib/interfaces"

const storage = new Storage()

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
            if (!workspaces.length) {
                workspaces = await storage.set("workspaces", []);
            }

            return workspaces
        },
        getWorkspace: async (workspaceId: String) : Promise<Workspace|boolean> => {
            const workspaces : Workspace[] = await storageObj.getWorkspaces()

            const workspaceIndex : number|boolean = workspaces.findIndex((o : Workspace) => o._id === workspaceId)

            return workspaceIndex > -1 ? workspaces[workspaceIndex] : false
        },
        setWorkspace: async (workspace: Workspace) : Promise<void> => {
            const workspaces : Workspace[] = await storageObj.getWorkspaces()
            const workspaceIndex : number|boolean = workspaces.findIndex((o : Workspace) => o._id === workspace._id)

            if(workspaceIndex > -1) {
                workspaces[workspaceIndex] = Object.assign(workspaces[workspaceIndex], workspace)
            }

            await storage.set("workspaces", workspaces)
        },
        getActiveWorkspace: async () : Promise<WorkspaceCache> => {
            return await storage.get("activeWorkspace")
        },
        setActiveWorkspace: async (workspace: Workspace) : Promise<void> => {
            await storage.set("activeWorkspace", workspace)
        },
        getActiveColumns: async () : Promise<Column[]|boolean> => {
            const workspace: WorkspaceCache = await storage.get("activeWorkspace")
            
            return !!workspace.columns ? workspace.columns : false
        },
        getColumns: async () : Promise<Column[]> => {
            const columns : Column[] = await storage.get("columns")
            if(!columns.length) {
                await storage.set("columns", [])
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

            await storage.set("columns", columns)
        },
        getWorkspaceColumns: async (workspaceId : String) : Promise<Column[]> => {
            const columns : Column[] =  await storageObj.getColumns()
            const workspaceColumns : Column[] = [];

            columns.forEach((column : Column) => {
                if(column.workspace === workspaceId) {
                    workspaceColumns.push(column)
                }
            })

            return workspaceColumns
        },
        getLinks: async () : Promise<Link[]> => {
            const links : Link[] = await storage.get("links")
            if(!links.length) {
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
