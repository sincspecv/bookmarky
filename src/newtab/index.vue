
<script setup lang="ts">
import type { App } from "vue"

// Plugins
import * as VueRouter from "vue-router"

// Components
import Workspace from "./components/Workspace"
import CreateWorkspace from "./components/CreateWorkspace"

// FontAwesome
/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { faCog } from '@fortawesome/free-solid-svg-icons'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { faExpandAlt } from '@fortawesome/free-solid-svg-icons'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { faArrowUp } from '@fortawesome/free-solid-svg-icons'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { faArrowDown } from '@fortawesome/free-solid-svg-icons'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { faSignInAlt } from '@fortawesome/free-solid-svg-icons'
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons'
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons'
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons'
import { faWindowClose } from '@fortawesome/free-regular-svg-icons'
import { faMinusSquare } from '@fortawesome/free-regular-svg-icons'
import { faPlusSquare } from '@fortawesome/free-regular-svg-icons'
import { faEdit } from '@fortawesome/free-regular-svg-icons'
import { faPauseCircle } from '@fortawesome/free-regular-svg-icons'
import { faFacebookSquare } from '@fortawesome/free-brands-svg-icons'
import { faTiktok } from '@fortawesome/free-brands-svg-icons'
import { faInstagram } from '@fortawesome/free-brands-svg-icons'
import { faLinkedin } from '@fortawesome/free-brands-svg-icons'
import { faYoutube } from '@fortawesome/free-brands-svg-icons'
import Menu from "~newtab/components/Menu.vue";

const workspaceModel = {
    id: "your-mpm"
}

library.add(faBars)
library.add(faCog)
library.add(faPlus)
library.add(faExternalLinkAlt)
library.add(faExpandAlt)
library.add(faTimes)
library.add(faArrowUp)
library.add(faArrowRight)
library.add(faArrowDown)
library.add(faArrowLeft)
library.add(faSignInAlt)
library.add(faEllipsisV)
library.add(faEllipsisH)
library.add(faTrashAlt)
library.add(faWindowClose)
library.add(faMinusSquare)
library.add(faPlusSquare)
library.add(faEdit)
library.add(faPauseCircle)
library.add(faFacebookSquare)
library.add(faTiktok)
library.add(faInstagram)
library.add(faLinkedin)
library.add(faYoutube)

defineOptions({
    prepare(app: App) {
        // Register our FontAwesome component
        app.component('font-awesome-icon', FontAwesomeIcon)

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
    }
})
</script>

<template>
    <div class="app-container h-full">
        <Suspense>
            <main id="main" class="h-full py-10">
                <Menu></Menu>
                <div class="container mx-auto h-full">
                    <router-view></router-view>
                </div>
            </main>
        </Suspense>
    </div>
</template>

<style>
  @import "~/style.css";
</style>
