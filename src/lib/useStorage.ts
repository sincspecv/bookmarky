import { Storage } from "@plasmohq/storage"

const storage = new Storage()

export const useStorage = () => {
    return {
        get: async (key: string) : Promise<any> => {
            return await storage.get(key)
        },
        set: async (key: string, value: any) : Promise<any> => {
            await storage.set(key, value)
        }
    }
}
