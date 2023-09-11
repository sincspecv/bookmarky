import type { RxColumnDocumentType } from '~lib/RxDB'
import type { RxJsonSchema } from 'rxdb';

// TODO: Add proper types

const columnSchema: RxJsonSchema<RxColumnDocumentType> = {
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
            type: 'number',
            minimum: 0,
            maximum: 100000000,
            multipleOf: 1
        }
    },
    required: ['_id', 'workspace', 'title', 'created'],
    indexes: ['created']
}

export default columnSchema
