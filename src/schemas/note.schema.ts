import type { RxNoteDocumentType } from '~lib/RxDB'
import type { RxJsonSchema } from 'rxdb';

// TODO: Add proper types

const noteSchema: RxJsonSchema<RxNoteDocumentType> = {
    version: 0,
    primaryKey: '_id',
    type: 'object',
    properties: {
        _id: {
            type: 'string',
            maxLength: 50,
        },
        workspace: {
            type: 'string'
        },
        noteData: {
            type: 'object',
        },
        created: {
            type: 'number',
            minimum: 0,
            maximum: 100000000,
            multipleOf: 1
        }
    },
    required: ['_id', 'workspace', 'created'],
    indexes: ['created']
}

export default noteSchema
