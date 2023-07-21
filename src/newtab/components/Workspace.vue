<script setup lang="ts">
    import * as browser from "webextension-polyfill"
    import { reactive, watch, ref, onMounted, nextTick } from "vue"
    import { useRouter, useRoute } from "vue-router"
    import WorkspaceColumn from "./WorkspaceColumn"
    import { v4 as uuidv4 } from "uuid"
    import { Storage } from "@plasmohq/storage"
    import * as _ from "lodash-es"

    import { useWorkspacesStore } from "~stores/useWorkspacesStore"

    const store = useWorkspacesStore();

    console.log(await store.getWorkspaces)

    // Icons
    import { PlusIcon } from '@heroicons/vue/24/solid'
    import { EllipsisVerticalIcon } from '@heroicons/vue/24/solid'
    import { PencilSquareIcon } from '@heroicons/vue/24/outline'
    import { TrashIcon } from '@heroicons/vue/24/outline'
    import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
    import { ArrowUpOnSquareStackIcon } from '@heroicons/vue/24/outline'
    import { BookmarkSquareIcon } from '@heroicons/vue/24/outline'
    import * as cheerio from "cheerio";

    const workspaceData = new Storage()
    const workspaces = ref(await workspaceData.get("workspaces"));
    const workspace = reactive({ name: "", id: "", columns: [] })
    const updateColumns = ref(Date.now())

    const workspaceNameInput = ref(null);
    const showWorkspaceNameInput = ref(false);
    const deleteWorkspaceModal = ref(null);
    const alertModal = ref(null)
    const alertModalMessage = ref("")

    const router = useRouter()
    const route = useRoute()

    // Make our dropdowns go away after clicking a menu item
    onMounted(() => {
        const dropdowns = document.querySelectorAll(".dropdown");
        dropdowns.forEach(_dropdown => {
            const menu = _dropdown.querySelector('.dropdown-content')
            menu.addEventListener('click', (e) => {
                // Make sure focus isn't already being handled by another function/method
                if(!e.target.classList.contains('handle-focus')) {
                    // Remove focus so that the dropdown disappears
                    document.activeElement.blur()
                }
            })
        })
    })

    /**
     * Redirect to the create workspace view
     */
    const redirectToCreateWorkspace = () => {
        router.push({name: "create-workspace", replace: true})
    }

    /**
     * Load all of our workspace data
     */
    const getWorkspace = async () => {
        // Make sure we have a workspace id and redirect
        // to the workspace creation view if not.
        if(!route.params.id) {
            redirectToCreateWorkspace()
        }

        // Make sure we have a workspaces array to work with
        if (!workspaces.value) {
            await workspaceData.set("workspaces", []);
        }

        // Make sure we have updated workspace data
        workspaces.value = await workspaceData.get("workspaces");

        // Check if our workspace exists
        const workspaceObject = _.find(workspaces.value, {id: route.params.id})
        const workspacesIndex = _.indexOf(workspaces.value, workspaceObject);

        // We have it. Let's set up our reactive variables
        if(workspacesIndex > -1) {
            Object.entries(workspace).forEach(_workspace => {
                const index = _.head(_workspace)

                // Get rid of null values in any arrays
                if(Array.isArray(workspaceObject[index])) {
                    workspaceObject[index].forEach((item, i) => {
                        if(item === null) {
                            workspaceObject[index].splice(i, 1);
                        }
                    })
                }

                workspace[index] = workspaceObject[index]
            })
        } else {
            redirectToCreateWorkspace()
        }

        // Set workspace as active workspace so that the same workspace is loaded when new tab is open
        await workspaceData.set("activeWorkspace", workspace)

        // Re-render our columns view
        updateColumns.value = Date.now();
    }

    const updateWorkspace = async () => {
        // Check if our workspace exists
        const workspaceObject = _.find(workspaces.value, {id: workspace.id})
        const workspacesIndex = _.indexOf(workspaces.value, workspaceObject);

        if(workspacesIndex > -1) {
            workspaces.value[workspacesIndex] = workspace
            await workspaceData.set(`workspaces`, workspaces.value)
        }
    }

    const focusWorkspaceNameInput = async () => {
        await nextTick()
        workspaceNameInput.value.focus()
    }

    const updateWorkspaceName = async () => {
        await updateWorkspace()
        showWorkspaceNameInput.value = false
    }

    const deleteWorkspace = async (showModal: boolean = true) => {
        if(showModal) {
            deleteWorkspaceModal.value.showModal()
        } else {
            // Check if our workspace exists
            const workspaceObject = _.find(workspaces.value, {id: route.params.id})
            const workspacesIndex = _.indexOf(workspaces.value, workspaceObject);

            // Remove it
            if(workspacesIndex > -1) {
                workspaces.value.splice(workspacesIndex, 1)
                await workspaceData.set(`workspaces`, workspaces.value)

                // redirectToCreateWorkspace()
                router.replace({name: "create-workspace", query: {render: true}})
            }

            closeDeleteWorkspaceModal()
        }
    }

    const closeDeleteWorkspaceModal = () => {
        deleteWorkspaceModal.value.close()
    }

    const closeAlertModal = () => {
        alertModal.value.close()

        // Delay clearing the alert message
        // to make the transition look cleaner
        setTimeout(() => {
            alertModalMessage.value = ""
        }, 100)
    }

    const addColumn = () => {
        workspace.columns.push({title: "", id: uuidv4(), links: []})
    }

    const openAllCollections = () => {
        if(!workspace.columns.length) {
            alertModalMessage.value = "No collection with links to open."
            alertModal.value.showModal();

            return false
        }

        workspace.columns.forEach(async column => {
            if(!column.links.length) {
                alertModalMessage.value = "No collection with links to open."
                alertModal.value.showModal();

                return false
            }

            let tabIds = []

            // First we have to open all of our links and then add the tab ID
            // to an array. After we have all of our links we can create a tab
            // and add the links to it using the array of tab IDs. After the
            // group is created and all the tabs have been added to it, we can
            // lastly add the column name as the tab name.
            await Promise.all(column.links.map(async link => {
                // Open our link
                const tab = await browser.tabs.create({
                    url: link.url
                })

                // Add the tab ID to our array
                tabIds.push(tab.id)
            })).then(() => {
                // Make sure we actually opened some tabs
                if(!!tabIds.length) {
                    // Create the group and add our tabs
                    browser.tabs.group({tabIds}, (groupId) => {
                        // Add the title to the group
                        browser.tabGroups.update(groupId, {title: column.title})
                    })
                }
            })
        })
    }

    const importTabGroups = async () => {
        const tabGroups = await browser.tabGroups.query({})

        if(!tabGroups.length) {
            alertModalMessage.value = "No open tab groups to import."
            alertModal.value.showModal();

            return false
        }

        // Loop through all the groups, then create a new
        // column and add all the tabs to each column
        tabGroups.map(async group => {
            // Initialize our new column
            const column = {title: "", id: "", links: []}

            column.title = group.title;

            await browser.tabs.query({groupId: group.id})
                .then(async tabs => {
                    // Loop through our tabs and build our links array
                    await Promise.all(tabs.map(async tab => {
                        const html = await fetch(tab.url).then(response => response.text())
                        const $ = cheerio.load(html);
                        const description = $('meta[name*="description"]').attr('content')

                        column.links.push({
                            id: uuidv4(),
                            title: tab.title,
                            url: tab.url,
                            favIconUrl: tab.favIconUrl,
                            description: !!description ? description : "No description",
                            createdOn: Date.now(),
                        })
                    }))
                })
                .then(() => {
                    // We need a title for our column, let's make
                    // one up in the event that we didn't get one
                    // from the group
                    if(!column.title.length) {
                        column.title = `Column ${(workspace.columns.length + 1).toString()}`
                    }

                    // Lastly, we need an ID
                    column.id = uuidv4()

                    // Column data is built. Send it.
                    workspace.columns.push(column)
                    updateWorkspace()
                })
        })
    }

    const showAlert = (message: string = "") => {
        alertModalMessage.value = message
        alertModal.value.showModal()
    }

    // Load our workspace
    getWorkspace();

    // Watch for our workspace id to change so that we can update the view
    watch(() => route.params.id, async (toParams, prevParams) => {
        // Update if the id param has changed
        if(!!toParams) {

            // Load our updated workspace
            await getWorkspace();
        }
    })

</script>

<template>
    <div class="h-full flex flex-col">
        <div class="flex flex-row justify-start gap-10 content-center items-center w-full">
            <div class="dropdown dropdown-right h-auto"  v-if="!showWorkspaceNameInput">
                <label
                    tabindex="0"
                    class="btn btn-ghost px-3 hover:btn-neutral btn-sm opacity-25 hover:opacity-100"
                >
                    <EllipsisVerticalIcon class="w-12" />
                </label>
                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-content">
                    <li><a @click="showWorkspaceNameInput = !showWorkspaceNameInput; focusWorkspaceNameInput();" class="handle-focus"><PencilSquareIcon class="w-12" /> Rename</a></li>
                    <li><a @click="deleteWorkspace" role="button" title="Delete workspace"><TrashIcon class="w-12" /> Delete</a></li>
                </ul>
            </div>

            <!-- Workspace Title -->
            <h1 class="text-3xl my-10 font-medium" v-if="!showWorkspaceNameInput" v-html="workspace.name"></h1>
            <!-- /Workspace Title -->

            <!-- Workspace Quick Actions -->
            <ul class="flex justify-center items-center gap-1" role="menu">
                <li class="tooltip tooltip-bottom" data-tip="Open all collections" v-if="!!workspace.columns.length">
                    <a class="btn btn-sm hover:btn-info" title="Open all collections" role="menuitem" @click="openAllCollections">
                        <ArrowUpOnSquareStackIcon class="h-8 w-8" />
                    </a>
                </li>
                <li class="tooltip tooltip-bottom" data-tip="Import open tab groups">
                    <a class="btn btn-sm hover:btn-info" title="Import open tab groups" role="menuitem" @click="importTabGroups">
                        <BookmarkSquareIcon class="h-8 w-8" />
                    </a>
                </li>
            </ul>
            <!-- /Workspace Quick Actions -->

            <form class="relative my-4 w-full max-w-md" v-if="!!showWorkspaceNameInput" @submit.prevent="updateWorkspaceName">
                <label :for="`workspace-name-${workspace.id}`" class="sr-only">Workspace Name</label>
                <input
                    ref="workspaceNameInput"
                    :name="`workspace-name-${workspace.id}`"
                    :id="`workspace-name-${workspace.id}`"
                    class="input input-md input-bordered input-info w-full"
                    placeholder="Workspace Name"
                    v-model="workspace.name"
                />
                <button
                    v-if="!!workspace.name"
                    type="submit"
                    class="absolute right-0 btn btn-ghost opacity-25 hover:opacity-100 hover:z-[1]"
                >
                    <ArrowRightOnRectangleIcon />
                </button>
            </form>
        </div>
        <div v-if="!!workspace.id" class="flex-1 overflow-y-auto">
            <div :key="updateColumns" class="grid grid-rows-1 grid-flow-col auto-cols-[21.378rem] gap-10 h-full py-10">
                <WorkspaceColumn :workspace="workspace" @update="updateWorkspace" @alert="showAlert" v-for="column in workspace.columns" :column="column"></WorkspaceColumn>
                <WorkspaceColumn :workspace="workspace" @update="updateWorkspace" v-if="!workspace.columns.length"></WorkspaceColumn>
                <!-- Add Column -->
                <div
                    v-if="workspace.columns.length"
                    @click="addColumn"
                    class="w-[21.378rem] h-full p-10 rounded-box bg-neutral bg-opacity-30 hover:bg-white hover:bg-opacity-10 text-lg flex justify-center items-center cursor-pointer"
                    role="button"
                >
                    <PlusIcon class="stroke-current stroke-0 mx-auto w-36" />
                    <span class="sr-only">Add new column</span>
                </div>
                <!-- /Add Column -->
            </div>
        </div>

        <!-- Delete Workspace Modal -->
        <dialog :id="`${workspace.id}_delete_prompt`" class="modal" v-if="!!workspace.id" ref="deleteWorkspaceModal">
            <div class="modal-box w-full max-w-max">
                <h2 class="font-bold text-lg">Are you sure?</h2>
                <div class="alert alert-warning my-10">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span class="font-bold">WARNING: This workspace will be deleted permanently and all data will be lost!</span>
                </div>

                <div class="modal-action">
                    <button class="btn btn-info btn-md" @click="closeDeleteWorkspaceModal">Cancel</button>
                    <button type="submit" class="btn btn-error btn-md" @click="deleteWorkspace(false)">Delete Workspace</button>
                </div>
            </div>
        </dialog>
        <!-- /Delete Workspace Modal -->

        <!-- Alert Modal -->
        <dialog :id="`${workspace.id}_alert_prompt`" class="modal" ref="alertModal">
            <div class="modal-box w-full max-w-max min-w-50">
                <strong class="pb-20 text-xl">{{alertModalMessage}}</strong>

                <div class="modal-action">
                    <button class="btn btn-info btn-sm" @click="closeAlertModal">OK</button>
                </div>
            </div>
        </dialog>
        <!-- /Alert Modal -->
    </div>
</template>

<style scoped>

</style>
