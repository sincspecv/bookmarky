import { Storage } from "@plasmohq/storage"
import type { Workspace, Column, Link } from "~lib/interfaces"

const storage = new Storage()

export const useWorkspaceStorage = () : object => {
    return {
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
        getActiveWorkspace: async () : Promise<Workspace> => {
            return await storage.get("activeWorkspace")
        },
        setActiveWorkspace: async (workspace: object) : Promise<void> => {
            await storage.set("activeWorkspace", workspace)
        },
        getActiveColumns: async () : Promise<object[]> => {
            const workspace: Workspace = await storage.get("activeWorkspace")
            return workspace.columns
        }
    }
}
