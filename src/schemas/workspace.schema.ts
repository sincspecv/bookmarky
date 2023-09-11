import type { RxWorkspaceDocumentType } from '~lib/RxDB'
import type { RxJsonSchema } from 'rxdb';

// TODO: Add proper types

const workspaceSchema: RxJsonSchema<RxWorkspaceDocumentType> = {
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
            type: 'number',
            minimum: 0,
            maximum: 100000000,
            multipleOf: 1
        }
    },
    required: ['_id', 'name', 'created'],
    indexes: ['created']
}

export default workspaceSchema
