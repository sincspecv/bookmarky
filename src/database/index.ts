import { createRxDatabase, addRxPlugin, removeRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';

// @ts-ignore
if(process.env.NODE_ENV !== 'production') {
    addRxPlugin(RxDBDevModePlugin);
}

// TODO: Add proper types

const workspaceSchema = {
    version: 0,
    primaryKey: '_id',
    type: 'object',
    properties: {
        _id: {
            type: 'string',
            maxLength: 50,
        },
        name: {
            type: 'string'
        },
        columns: {
            type: 'array',
            uniqueItems: true,
            items: {
                type: 'string',
                uniqueItems: true
            }
        },
        created: {
            type: 'number'
        }
    },
    required: ['_id', 'name']
} as const


const columnSchema = {
    version: 0,
    primaryKey: '_id',
    type: 'object',
    properties: {
        _id: {
            type: 'string',
            maxLength: 50,
        },
        workspace: {
            type: 'string',
            maxLength: 50,
        },
        title: {
            type:'string'
        },
        links: {
            type: 'array',
            uniqueItems: true,
            items: {
                type: 'object',
                properties: {
                    _id: {
                        type: 'string'
                    },
                    title: {
                        type: 'string'
                    },
                    url: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    favIconUrl: {
                        type: 'string'
                    },
                    created: {
                        type: 'number'
                    }
                }
            },
            required: ['_id', 'title', 'url']
        },
        created: {
            type: 'number'
        }
    },
    required: ['_id', 'workspace', 'title']
}

const useWorkspacesStorage = async () => {
    const useRxDB = await createRxDatabase({
        name: 'bookmarky_workspaces',
        storage: getRxStorageDexie(),
        eventReduce: true,
        ignoreDuplicate: true,
    })

    // await removeRxDatabase("bookmarky_workspaces", getRxStorageDexie())

    return await useRxDB.addCollections({
        workspaces: {
            schema: workspaceSchema
        },
        columns: {
            schema: columnSchema
        }
    })
}

export default useWorkspacesStorage
