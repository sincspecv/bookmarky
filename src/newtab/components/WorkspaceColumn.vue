<script setup lang="ts">
import * as browser from "webextension-polyfill"
import {reactive, ref, onMounted, nextTick, Ref} from "vue"
import { v4 as uuidv4 } from "uuid"
import {useRoute, useRouter} from "vue-router";
import WorkspaceColumnLink from "./WorkspaceColumnLink"
import * as cheerio from "cheerio"
import isURL from "validator/es/lib/isURL"
import escape from "validator/es/lib/escape"
import { useWorkspacesStore } from "~stores/useWorkspacesStore"
import { useRxStore } from "~stores/useRxStore";
import type { Workspace, Column, Link } from "~lib/interfaces"


// Icons
import { PlusIcon } from '@heroicons/vue/24/solid'
import { EllipsisVerticalIcon } from '@heroicons/vue/24/solid'
import { ArrowUpOnSquareStackIcon, BookmarkSquareIcon, PencilSquareIcon} from '@heroicons/vue/24/outline'
import { TrashIcon } from '@heroicons/vue/24/outline'
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

// Configure our URL sanitation
const isURLOptions = {
    protocols: ['http', 'https', 'ftp', 'file'],
    require_protocol: true,
    allow_underscores: true,
}

const router = useRouter()
const route = useRoute()

// Get our browser tabs
const browserTabs = ref(await browser.tabs.query({currentWindow: true, url: ["https://*/*", "http://*/*", "ftp://*/*", "file://*/*"]}))

// Keep our tab list updated when they change
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    browserTabs.value = await browser.tabs.query({currentWindow: true, url: ["https://*/*", "http://*/*", "file://*/*"]});
})


// Get our workspaces store
// const workspacesStore = useWorkspacesStore()
const workspacesStore = useRxStore()
const activeWorkspace = await workspacesStore.getActiveWorkspace

// Collect our props from the parent component
const props = defineProps(['columnId'])

// And our emits
const emits = defineEmits(['update', 'alert'])

// Error object
const errorMessages = reactive({textLinkInput: ""})

// Init our element refs
const titleInput = ref(null)
const addLinkModal = ref(null)
const textLink = reactive({url: "", title: "", description: "", favIconUrl: ""})

// Init our column
const emptyColumn : Column = {_id: "", title: "", workspace: activeWorkspace?._id, links: []}
const column : Ref<Column> = ref(emptyColumn)
const showInput : Ref<boolean> = ref(!column.value.title)

// Check if we have a column
if(!!props.columnId) {
    column.value = workspacesStore.getColumnById(props.columnId)
    showInput.value = !column.value?.title;
}


/**
 * Focus on the title input if it is visible on mount
 *
 * @see https://vuejs.org/guide/essentials/template-refs.html#accessing-the-refs
 */
onMounted(() => {
    if(showInput.value) {
        titleInput.value.focus();
    }
})

const updateColumn = () => {
    if(!column.value?._id) {
      column.value._id = uuidv4()
    }

    if(!column.value?.workspace) {
      column.value.workspace = activeWorkspace._id
    }

    column.value.title = escape(column.value.title)

    workspacesStore.setColumn(column.value)

    hideTitleInput()
}

const showTitleInput = async () => {
    showInput.value = true;

    /**
     * TODO: Fix error when trying to focus on input
     */
    await nextTick()
    titleInput.value.focus();
}

// Save the new title
const hideTitleInput = () => {
    // Make sure there is an actual value in the input
    if(!!column.value.title) {
        showInput.value = false
    }
}

const removeColumn = () => {
    workspacesStore.removeColumn(column.value)
}

// Show the "Add A Link" modal
const showAddLinkModal = () => {
    addLinkModal.value.showModal()
}

// Close the "Add A Link" modal
const closeAddLinkModal = () => {
    textLink.url = ""
    errorMessages.textLinkInput = ""
    addLinkModal.value.close()
}

// Add a link from the selection of tabs
const addTabLink = async (tab = {}) => {
    // Due to Chrome's ridiculous storage limitations we are omitting the
    // description for now but plan to add it later once we figure out how

    // const html = await fetch(tab.url).then(response => response.text())
    // const $ = cheerio.load(html);
    // const description = $('meta[name*="description"]').attr('content')

    const link : Link = {
        _id: uuidv4(),
        title: escape(tab.title),
        url: tab.url,
        favIconUrl: tab.favIconUrl,
        description: "",
        created: Date.now(),
    }

    column.value.links.push(link);

    await workspacesStore.setColumn(column.value).then(() => {
        closeAddLinkModal();
    })
}

// Add a manually entered URL to the link list
const addTextLink = async () => {
    // Make sure we have a valid URL
    if(!isURL(textLink.url, isURLOptions)) {
        errorMessages.textLinkInput = "Please enter a valid URL"
        return false;
    }

    const splitURL = textLink.url.split("/")
    const protocol = splitURL[0]
    const baseURL = splitURL[2]

    // Get our markup to parse
    const html = await fetch(textLink.url).then(response => response.text())
    const $ = cheerio.load(html);

    // Parse our markup and assign variables
    textLink.title = $('title').text()
    textLink.favIconUrl = $('link[rel*="icon"]').attr('href')

    // Due to Chrome's ridiculous storage limitations we are omitting the
    // description for now but plan to add it later once we figure out how
    // textLink.description = $('meta[name*="description"]').attr('content')

    // Check if we have a favicon in the root dir if none was specified in the markup
    if(typeof textLink.favIconUrl === "undefined") {
        const rootFavIcon = await fetch(`${protocol}//${baseURL}/favicon.ico`)

        if(rootFavIcon.status === 200) {
            textLink.favIconUrl = isURL(rootFavIcon.url, isURLOptions) ? rootFavIcon.url : ""
        }
    }

    // Fix a relative URl
    if(typeof textLink.favIconUrl === "string" && !textLink.favIconUrl.startsWith("http")) {
        textLink.favIconUrl = `https://${baseURL}${textLink.favIconUrl}`
    }

    const link = {
        _id: uuidv4(),
        title: escape(textLink.title),
        url: textLink.url.replace(/\/?$/, '/'), // Make sure we have a trailing slash to make the browser API happy later
        favIconUrl: textLink.favIconUrl,
        description: "",
        createdOn: Date.now(),
    }

    column.value.links.push(link);

    await workspacesStore.setColumn(column.value).then(() => {
        closeAddLinkModal()
    })
}

const removeLink = async (id: string) => {
    const linkIndex = column.value.links.findIndex((link) => link._id === id);

    if(linkIndex > -1) {
        column.value.links.splice(linkIndex, 1)
        await workspacesStore.setColumn(column.value)
    }
}

const openAllLinks = async () => {
    // TODO: Set up global alert box and handle message with global state
    if(!column.value.links.length) {
        emits('alert', 'No links to open.')
        return false;
    }

    // First we have to open all of our links and then add the tab ID
    // to an array. After we have all of our links we can create a tab
    // and add the links to it using the array of tab IDs. After the
    // group is created and all the tabs have been added to it, we can
    // lastly add the column name as the tab name.
    let tabIds = []
    await Promise.all(column.value.links.map(async link => {
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
                browser.tabGroups.update(groupId, {title: column.value.title})
            })
        }
    })
}

const importOpenTabs = async () => {
    // TODO: Set up global alert box and handle message with global state
    if(!browserTabs.value.length) {
        emits('alert', 'No tabs to import.')
        return false;
    }

    await Promise.all(browserTabs.value.map(async tab => {
        // Due to Chrome's ridiculous storage limitations we are omitting the
        // description for now but plan to add it later once we figure out how

        // const html = await fetch(tab.url).then(response => response.text())
        // const $ = cheerio.load(html);
        // const description = $('meta[name*="description"]').attr('content')

        column.value.links.push({
            _id: uuidv4(),
            title: tab.title,
            url: tab.url,
            favIconUrl: tab.favIconUrl,
            description: "",
            created: Date.now(),
        })

    })).then(async () => {
        await workspacesStore.setColumn(column.value)
    })


}
</script>

<template>
    <!-- Column -->
    <div class="w-[21.378rem] h-full p-10 rounded-box drop-shadow-md bg-neutral text-lg" :id="column._id">
        <!-- Column Title -->
        <div class="text-xl relative px-10 py-5">
            <div class="flex flex-row justify-between content-center" v-if="!showInput">
                <h2 class="font-medium" v-html="column.title"></h2>
                <div class="dropdown dropdown-bottom dropdown-end h-full">
                    <label
                      tabindex="0"
                      class="btn btn-ghost px-3 hover:btn-neutral btn-sm opacity-25 hover:opacity-100"
                    >
                      <EllipsisVerticalIcon class="w-12" />
                    </label>
                    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-content">
                      <li><a @click="showTitleInput" class="handle-focus"><PencilSquareIcon class="w-12" role="button" :aria-controls="`column-title-${column._id}`" /> Rename</a></li>
                      <li><a @click="removeColumn" role="button" :aria-controls="column._id" title="Delete column"><TrashIcon class="w-12" /> Delete</a></li>
                    </ul>
                </div>
            </div>
            <form class="relative" v-if="!!showInput" @submit.prevent="updateColumn">
              <label :for="`column-title-${column._id}`" class="sr-only">Collection title</label>
              <input
                      ref="titleInput"
                      :name="`column-title-${column._id}`"
                      :id="`column-title-${column._id}`"
                      class="input input-md input-bordered input-info w-full"
                      placeholder="Collection Title"
                      v-model="column.title"
              />
              <button
                      v-if="!!column.title"
                      type="submit"
                      class="absolute right-0 btn btn-ghost opacity-25 hover:opacity-100 hover:z-[1]"
              >
                  <ArrowRightOnRectangleIcon class="w-12" />
              </button>
          </form>
            <!-- Column Quick Actions -->
            <ul class="flex justify-start items-center gap-1" role="menu"  v-if="!showInput">
                <li class="tooltip tooltip-bottom" data-tip="Open all links" v-if="!!column.links.length">
                    <a class="btn btn-xs hover:btn-info" title="Open all links" role="menuitem" @click="openAllLinks">
                        <ArrowUpOnSquareStackIcon class="h-5 w-5" />
                    </a>
                </li>
                <li class="tooltip tooltip-bottom" data-tip="Import all open tabs">
                    <a class="btn btn-xs hover:btn-info" title="Import all open tabs" role="menuitem" @click="importOpenTabs">
                        <BookmarkSquareIcon class="h-5 w-5" />
                    </a>
                </li>
            </ul>
            <!-- /Column Quick Actions -->
        </div>
        <!-- /Column Title -->
        <!-- Links Container -->
        <div class="relative overflow-y-scroll" style="height: calc(100% - 111px)">
            <div class="w-full grid grid-rows-auto gap-10 overflow-hidden absolute top-0 left-0" v-if="!!column._id">
                <!-- Links -->
                <WorkspaceColumnLink v-for="link in column.links" :link="link" @remove="removeLink" />
                <!-- /Links -->
                <!-- Add Link Button -->
                <a class="w-full mb-xxj btn btn-neutral rounded-btn text-center btn-lg hover:bg-white hover:bg-opacity-10"
                   title="Add a new link"
                   role="button"
                   @click="showAddLinkModal"
                >
                    <PlusIcon class="stroke-current stroke-0 w-32 mx-auto" />
                    <span class="sr-only">Add new link</span>
                </a>
                <!-- /Add Link Button -->
            </div>
        </div>
        <!-- /Links Container -->
    </div>
    <!-- /Column -->

    <!-- Add Link Modal -->
    <dialog :id="`${column._id}_add_link`" class="modal" v-if="!!column._id" ref="addLinkModal">
        <div class="modal-box">
            <h2 class="font-bold text-lg">Add a link</h2>
            <p class="py-4">Select one of your open tabs below</p>

            <!-- Tab List -->
            <div class="max-h-48 w-full carousel carousel-vertical rounded-md">
                <button
                    v-for="tab in browserTabs"
                    @click="addTabLink(tab)"
                    class="btn btn-lg join-item rounded-none flex justify-start flex-nowrap gap-5"
                >
                    <div class="avatar">
                        <figure class="w-24 rounded">
                            <img :src="tab.favIconUrl" />
                        </figure>
                    </div>
                    <div class="flex flex-col text-left overflow-hidden">
                        <h3 class="normal-case text-bold text-md truncate text-ellipses mb-1 tracking-normal">{{tab.title}}</h3>
                        <span class="normal-case text-xs overflow-hidden truncate text-ellipses">{{tab.url}}</span>
                    </div>
                </button>
            </div>
            <!-- /Tab List -->

            <div class="mt-10">
                <label for="linkUrl" class="block mb-5">
                    Or enter a URL
                </label>
                <input
                    type="text"
                    name="linkUrl"
                    id="linkUrl"
                    placeholder="Enter URL"
                    v-model="textLink.url"
                    class="input input-bordered w-full"
                />
                <p class="text-error text-md p-2 flex flex-row justify-start" role="alert" v-show="!!errorMessages.textLinkInput"><span class="inline float-left" v-if="!!errorMessages.textLinkInput"><ExclamationCircleIcon class="inline float-left mr-[4px] w-12" /> ERROR:&nbsp;</span> {{errorMessages.textLinkInput}}</p>
            </div>

            <div class="modal-action">
                <button class="btn btn-neutral btn-sm" @click="closeAddLinkModal">Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm" @click="addTextLink">Add</button>
            </div>
        </div>
    </dialog>
    <!-- /Add Link Modal -->
</template>

<style scoped>

</style>
