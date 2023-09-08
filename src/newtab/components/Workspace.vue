<script setup lang="ts">
    import * as browser from "webextension-polyfill"
    import { watch, ref, onMounted, nextTick, Ref } from "vue"
    import { useRouter, useRoute } from "vue-router"
    import WorkspaceColumn from "./WorkspaceColumn"
    import { v4 as uuidv4 } from "uuid"
    // import * as cheerio from "cheerio";
    import { useRxStore } from "~stores/useRxStore";
    import useWorkspacesStorage from "~database";
    import isURL from "validator/es/lib/isURL"
    import escape from "validator/es/lib/escape"

    import type { Workspace, Column, Link } from "~lib/App"
    import type { RxWorkspaceDocument, RxColumnDocument } from "~lib/RxDB";


    // Icons
    import { PlusIcon } from '@heroicons/vue/24/solid'
    import { EllipsisVerticalIcon } from '@heroicons/vue/24/solid'
    import { PencilSquareIcon } from '@heroicons/vue/24/outline'
    import { TrashIcon } from '@heroicons/vue/24/outline'
    import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
    import { ArrowUpOnSquareStackIcon } from '@heroicons/vue/24/outline'
    import { BookmarkSquareIcon } from '@heroicons/vue/24/outline'

    // Configure our URL sanitation
    const isURLOptions = {
        protocols: ['http', 'https', 'ftp', 'file'],
        require_protocol: true,
        allow_underscores: true,
    }

    const workspacesStore = useRxStore()
    const db = await useWorkspacesStorage()

    const router = useRouter()
    const route = useRoute()

    // If we don't have an ID we can't load our workspace
    if(!route.params.id.length) {
      router.push({name: "create-workspace", replace: true})
    }

    await workspacesStore.setActiveWorkspace(route.params.id.toString())

    const workspace : Ref<RxWorkspaceDocument> = ref(await db.workspaces.findOne(route.params.id.toString()).exec())
    const columns : Ref<RxColumnDocument[]> = ref(await db.columns.find({ selector: { workspace: workspace.value._id } }).sort({created: "asc"}).exec())

    const workspaceNameInput = ref(null);
    const showWorkspaceNameInput = ref(false);
    const deleteWorkspaceModal = ref(null);
    const alertModal = ref(null)
    const alertModalMessage = ref("")


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

        // Make sure firstLoad is set to false
        workspacesStore.setFirstLoad(false)
    })

    /**
     * Redirect to the create workspace view
     */
    const redirectToCreateWorkspace = () => {
        router.push({name: "create-workspace", replace: true})
    }

    const setWorkspaceColumns = async () => {
        columns.value = await db.columns.find({ selector: { workspace: workspace.value._id } }).sort({created: "asc"}).exec()
    }

    /**
     * Load all of our workspace data
     */
    const loadWorkspace = async () => {

        // Make sure we have a workspace id and redirect
        // to the workspace creation view if not.
        if(!route.params.id) {
            redirectToCreateWorkspace()
        }

        // Set workspace as active workspace so that the same workspace is loaded when new tab is open
        // await workspaceData.set("workspace", workspace)
        workspace.value = await db.workspaces.findOne(route.params.id.toString()).exec()
        await setWorkspaceColumns()

        await workspace.value.$.subscribe(async (event) => {
            workspace.value = await db.workspaces.findOne(workspace.value._id).exec()
        })

        // Set the current workspace as the active workspace
        await workspacesStore.setActiveWorkspace(route.params.id.toString())
    }

    const focusWorkspaceNameInput = async () => {
        await nextTick()
        workspaceNameInput.value.focus()
    }

    const updateWorkspaceName = async () => {
        // await updateWorkspace()
        // await storage.setWorkspace(workspace.value)

        await workspace.value.modify((data) => {
            data.name = workspaceNameInput.value.value
            return data
        })

        // workspace.value.name = workspaceNameInput.value.value

        showWorkspaceNameInput.value = false
    }

    const deleteWorkspace = async (showModal: boolean = true) => {
        if(showModal) {
            deleteWorkspaceModal.value.showModal()
        } else {
            // Query for associated columns so that they can be removed
            const _columns = await db.columns.find({
                selector: {
                    workspace: workspace.value._id
                }
            }).exec()

            // We have to change route before removing the
            // data in order to prevent an error caused by
            // the missing data.
            closeDeleteWorkspaceModal()
            await router.push({name: "create-workspace"})

            // Remove the associated columns
            await db.columns.bulkRemove(_columns.map(c => c._id))

            // Remove the workspace
            await db.workspaces.bulkRemove([workspace.value._id])
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

    /**
     * Add new column to workspace.
     */
    const addColumn = async () => {
        const newColumn : Column = {
            _id: uuidv4(),
            workspace: workspace.value._id,
            title: "",
            links: [],
            created: Date.now()
        }

        const _workspace = await db.workspaces.findOne(newColumn.workspace).exec()
        await _workspace.modify((data) => {
            const columnIndex = data.columns.findIndex((c) => c._id === newColumn._id)

            if(columnIndex > -1) {
                Object.assign(data.columns[columnIndex], newColumn._id)
            } else {
                data.columns = data.columns.concat(newColumn._id)
            }

            return data
        })

        await db.columns.upsert(newColumn)
        await setWorkspaceColumns()
    }

    const openAllCollections = async () : Promise<void> => {
        await setWorkspaceColumns()
        const hasLinks = columns.value.findIndex((column : Column) => !!column.links.length) > -1

        if(!hasLinks || !columns.value.length) {
            alertModalMessage.value = "No collection with links to open."
            alertModal.value.showModal()

            return
        }

        columns.value.forEach((column : Column) => {
            let tabIds = []

            // First we have to open all of our links and then add the tab ID
            // to an array. After we have all of our links we can create a tab
            // and add the links to it using the array of tab IDs. After the
            // group is created and all the tabs have been added to it, we can
            // lastly add the column name as the tab name.
            Promise.all(column.links.map(async link => {
                // If we don't have a link then there is no need to proceed
                if(!link.url?.length || !isURL(link.url, isURLOptions)) {
                  return;
                }

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

        const newColumns = []

        // Loop through all the groups, then create a new
        // column and add all the tabs within the group to
        // each column as a link
        tabGroups.forEach((group) => {
            // Initialize our new column
            const column : Column = {
                _id: uuidv4(),
                title: escape(group.title),
                workspace: workspace.value._id,
                links: [],
                created: Date.now()
            }

            // We need a title for our column, let's make
            // one up in the event that we didn't get one
            // from the group
            if(!column.title.length) {
              column.title = `Collection ${(workspace.value.columns.length + 1).toString()}`
            }

            // Loop through all the tabs in the group
            // and add each tab to our column
            browser.tabs.query({groupId: group.id})
                .then(async tabs => {
                    // Loop through our tabs and grab the links
                    await Promise.all(tabs.map(async tab => {
                        // const html = await fetch(tab.url).then(response => response.text())
                        // const $ = cheerio.load(html);
                        // const description = $('meta[name*="description"]').attr('content')
                        const link : Link = {
                          _id: uuidv4(),
                          column: column._id,
                          title: escape(tab.title),
                          url: isURL(tab.url, isURLOptions) ? tab.url : "",
                          favIconUrl: isURL(tab.favIconUrl, isURLOptions) ? tab.favIconUrl : "",
                          description: "",
                          created: Date.now(),
                        }

                        // Add the link to our column
                        column.links.push(link)
                    }))

                    newColumns.push(column)
                })
                .then(async () => {
                    // Column data is built. Send it.
                    await db.columns.bulkUpsert(newColumns)

                    await workspace.value.modify((data) => {
                        data.columns = data.columns.concat(newColumns.map((column) => column._id))
                        return data
                    })
                })
        })
    }

    const showAlert = (message: string = "") => {
        alertModalMessage.value = message
        alertModal.value.showModal()
    }

    // Load our workspace
    loadWorkspace();

    // Watch for our workspace id to change so that we can update the view
    watch(() => route.params.id, async (toParams, prevParams) => {
        // Update if the id param has changed
        if(!!toParams) {
            // Load our updated workspace
            await loadWorkspace();
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
            <h1 class="workspace-name text-3xl my-10 font-medium" v-if="!showWorkspaceNameInput" v-html="workspace.name"></h1>
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
                <label :for="`workspace-name-${workspace._id}`" class="sr-only">Workspace Name</label>
                <input
                    ref="workspaceNameInput"
                    :name="`workspace-name-${workspace._id}`"
                    :id="`workspace-name-${workspace._id}`"
                    class="input input-md input-bordered input-info w-full"
                    placeholder="Workspace Name"
                    :value="workspace.name"
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
        <div v-if="!!workspace._id" class="flex-1 overflow-y-auto">
            <div :key="workspace._id" class="grid grid-rows-1 grid-flow-col auto-cols-[21.378rem] gap-10 h-full py-10">
                <WorkspaceColumn @alert="showAlert" v-for="column in workspace.columns" :columnId="column"></WorkspaceColumn>
                <WorkspaceColumn v-if="!workspace.columns.length"></WorkspaceColumn>
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
        <dialog :id="`${workspace._id}_delete_prompt`" class="modal" v-if="!!workspace._id" ref="deleteWorkspaceModal">
            <div class="modal-box w-full max-w-max">
                <h2 class="font-bold text-lg">Are you sure?</h2>
                <div class="alert alert-warning my-10">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
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
        <dialog :id="`${workspace._id}_alert_prompt`" class="modal" ref="alertModal">
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
