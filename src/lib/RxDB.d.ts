/**
 * custom typings so typescript knows about the schema-fields
 *
 * @see https://github.com/pubkey/rxdb/blob/master/examples/vue/src/RxDB.d.ts
 */

import { RxDocument, RxCollection, RxDatabase } from 'rxdb';

export interface RxWorkspaceDocumentType {
    _id: string;
    name: string;
    columns: Array<string>;
    created: number;
}

export interface RxColumnDocumentType {
    _id: string;
    workspace: string;
    title: string;
    links: Array<{
        _id: string,
        title: string,
        url: string,
        description?: string,
        favIconUrl?: string,
        created: number
    }>;
    created: number;
}

export type RxWorkspaceDocument = RxDocument<RxWorkspaceDocumentType>;
export type RxColumnDocument = RxDocument<RxColumnDocumentType>;

export type RxWorkspaceCollection = RxCollection<RxWorkspaceDocumentType, {}>;
export type RxColumnCollection = RxCollection<RxColumnDocumentType, {}>;

export interface RxBookmarkyCollections {
    workspaces: RxWorkspaceCollection,
    columns: RxColumnCollection
}

export type RxBookmarkyDatabase = RxDatabase<RxBookmarkyCollections>;
