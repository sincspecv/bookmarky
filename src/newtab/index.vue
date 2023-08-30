
<script setup lang="ts">
import type { App } from "vue"

// Plugins
import * as VueRouter from "vue-router"
import {createPinia, storeToRefs} from 'pinia'
import * as Sentry from "@sentry/vue";

// Components
import Menu from "~newtab/components/Menu.vue";
import Workspace from "./components/Workspace"
import CreateWorkspace from "./components/CreateWorkspace"

import { useWorkspacesStore } from "~stores/useWorkspacesStore"

// Load workspace data from persistent storage
const workspacesStore = useWorkspacesStore()
workspacesStore.loadWorkspaces()

defineOptions({
    prepare(app: App) {
        // Define some routes
        const routes = [
            { path: '/', name: "create-workspace", component: CreateWorkspace },
            { path: '/workspace/:id', name: "workspace", component: Workspace, props: true },
        ]

        // Create the router instance and pass the `routes` option
        const router = VueRouter.createRouter({
            // Provide the history implementation to use.
            // We are using the hash history for simplicity here.
            history: VueRouter.createWebHashHistory(),
            routes, // short for `routes: routes`
        })

        Sentry.init({
            app,
            dsn: "https://139b25d4132fedc69ce38dda03de5e26@o4504142166032384.ingest.sentry.io/4505794536472576",
            integrations: [
                new Sentry.BrowserTracing({
                    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
                    tracePropagationTargets: ["localhost"],
                    routingInstrumentation: Sentry.vueRouterInstrumentation(router),
                }),
                new Sentry.Replay(),
            ],
            // Performance Monitoring
            tracesSampleRate: 0.8, // Capture 100% of the transactions, reduce in production!
            // Session Replay
            replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
            replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
        });

        // Init our plugins
        app.use(router)
        app.use(createPinia())
    }
})
</script>

<template>
    <div class="app-container h-full">
        <Suspense>
            <main id="main" class="h-full w-full max-w-full">
                <Menu></Menu>
                <div class="mx-auto h-full w-full min-w-0">
                    <router-view></router-view>
                </div>
            </main>
        </Suspense>
    </div>
</template>

<style>
  @import "~/style.css";
</style>
