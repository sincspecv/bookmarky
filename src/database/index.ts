import { createRxDatabase, addRxPlugin, removeRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { KEY_DATABASE } from '~lib/keys'

// Import Schemas
import workspaceSchema from '~schemas/workspace.schema'
import columnSchema from '~schemas/column.schema'

// Add leader election and cleanup plugin
addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBCleanupPlugin);

// Add dev mode if not in production
// @ts-ignore
if(process.env.NODE_ENV !== 'production') {
    addRxPlugin(RxDBDevModePlugin);
}

// import typings
import type { RxBookmarkyDatabase } from '~lib/RxDB';


export default async function useWorkspacesStorage() {
    const db : RxBookmarkyDatabase = await createRxDatabase({
        name: 'bookmarky',
        storage: getRxStorageDexie(),
        eventReduce: false,
        ignoreDuplicate: true,
    });

    // show leadership in title
    db.waitForLeadership().then(() => {
        console.log('isLeader now');
        document.title = '♛ ' + document.title;
    });

    // await removeRxDatabase("bookmarky_workspaces", getRxStorageDexie())
    // await removeRxDatabase("bookmarky", getRxStorageDexie())

    await db.addCollections({
        workspaces: {
            schema: workspaceSchema
        },
        columns: {
            schema: columnSchema
        }
    })

    // return {
    //     install(app: any) {
    //         console.log("we're installing")
    //         app.config.globalProperties.$db = db
    //         app.provide(KEY_DATABASE, readonly(db))
    //         return app
    //     },
    //     useDatabase(): RxBookmarkyDatabase {
    //         return inject(KEY_DATABASE) as RxBookmarkyDatabase
    //     },
    // };

    return db
}
