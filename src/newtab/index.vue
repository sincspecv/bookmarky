
<script setup lang="ts">
import type { App } from "vue"

// Plugins
import * as VueRouter from "vue-router"
import { createPinia } from 'pinia'

// Components
import Menu from "~newtab/components/Menu.vue";
import Workspace from "./components/Workspace"
import CreateWorkspace from "./components/CreateWorkspace"

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
