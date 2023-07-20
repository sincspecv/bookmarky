<script setup lang="ts">
import * as browser from "webextension-polyfill"
import { reactive, ref, onMounted, nextTick } from "vue"
import { v4 as uuidv4 } from "uuid"
import { Storage } from "@plasmohq/storage"
import * as _ from "lodash-es"
import {useRoute, useRouter} from "vue-router";
import WorkspaceColumnLink from "./WorkspaceColumnLink"
import * as cheerio from "cheerio"
import isURL from "validator/es/lib/isURL"
import escape from "validator/es/lib/escape"


// Icons
import { PlusIcon } from '@heroicons/vue/24/solid'
import { EllipsisVerticalIcon } from '@heroicons/vue/24/solid'
import { PencilSquareIcon } from '@heroicons/vue/24/outline'
import { TrashIcon } from '@heroicons/vue/24/outline'
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

const isURLOptions = {
    protocols: ['http', 'https', 'file'],
    require_protocol: true,
    allow_underscores: true,
}

const router = useRouter()
const route = useRoute()

// Get our browser tabs
const browserTabs = ref(await browser.tabs.query({currentWindow: true, url: ["https://*/*", "http://*/*", "file://*/*"]}))

// Keep our tab list updated when they change
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    browserTabs.value = await browser.tabs.query({currentWindow: true, url: ["https://*/*", "http://*/*", "file://*/*"]});
})

// Collect our props from the parent component
const props = defineProps(['workspace', 'column'])

// And our emits
const emits = defineEmits(['update'])

// Make sure we have a workspace and redirect if not
if(!props.workspace) {
    router.push({name: "create-workspace", replace: true})
}

// Error object
const errorMessages = reactive({textLinkInput: ""})

// Init our element refs
const titleInput = ref(null)
const addLinkModal = ref(null)
const textLink = reactive({url: "", title: "", description: "", favIconUrl: ""})

// Init our column
const column = reactive({title: "", id: "", links: []})
const showInput = ref(!column.title)

// Check if we have a column
if(!!props.column) {
    Object.entries(props.column).forEach(_column => {
        const index = _.head(_column)
        column[index] = props.column[index]
    })

    showInput.value = !column.title;
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
    if(!column.id) {
        column.id = uuidv4()
    }

    // Find the column in the workspace object
    const columnObject = _.find(props.workspace.columns, { id: column.id })
    const columnIndex = _.indexOf(props.workspace.columns, columnObject);

    // Update the column
    if(columnIndex > -1) {
        Object.entries(props.workspace.columns[columnIndex]).forEach(_column => {
            const index = _.head(_column)
            props.workspace.columns[columnIndex][index] = column[index]
        })
    } else {
        props.workspace.columns.push(column);
    }

    emits('update', props.workspace)

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
    if(!!column.title) {
        showInput.value = false
        column.title = escape(column.title)
    }

    // Initialize column if needed
    if(!column.id) {
        column.id = uuidv4();
        props.workspace.columns.push(column);
    }
}

const removeColumn = () => {
    const columnObject = _.find(props.workspace.columns, { id: column.id })
    const columnIndex = _.indexOf(props.workspace.columns, columnObject);

    if(columnIndex > -1) {
        props.workspace.columns.splice(columnIndex, 1)
        emits('update', props.workspace)
    }
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
    const html = await fetch(tab.url).then(response => response.text())
    const $ = cheerio.load(html);
    const description = $('meta[name*="description"]').attr('content')

    const link = {
        id: uuidv4(),
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl,
        description: !!description ? description : "",
        createdOn: Date.now(),
    }

    column.links.push(link);
    emits('update', props.workspace)
    closeAddLinkModal();
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
    textLink.description = $('meta[name*="description"]').attr('content')
    textLink.favIconUrl = $('link[rel*="icon"]').attr('href')

    // Check if we have a favicon in the root dir if none was specified in the markup
    if(typeof textLink.favIconUrl === "undefined") {
        const rootFavIcon = await fetch(`${protocol}//${baseURL}/favicon.ico`)

        if(rootFavIcon.status === 200) {
            textLink.favIconUrl = isURL(rootFavIcon.url, isURLOptions) ? rootFavIcon.url : ""
        }
    }

    if(typeof textLink.favIconUrl === "string" && !textLink.favIconUrl.startsWith("http")) {
        textLink.favIconUrl = `https://${baseURL}${textLink.favIconUrl}`
    }

    const link = {
        id: uuidv4(),
        title: textLink.title,
        url: textLink.url.replace(/\/?$/, '/'), // Make sure we have a trailing slash to make the browser API happy later
        favIconUrl: textLink.favIconUrl,
        description: textLink.description,
        createdOn: Date.now(),
    }

    column.links.push(link);
    emits('update', props.workspace)
    closeAddLinkModal()
}

const removeLink = (id: string) => {
    const linkObject = _.find(column.links, { id: id })
    const linkIndex = _.indexOf(column.links, linkObject);

    if(linkIndex > -1) {
        column.links.splice(linkIndex, 1)
        emits('update', props.workspace)
    }
}
</script>

<template>
    <!-- Column -->
    <div class="w-[21.378rem] h-full p-10 rounded-box drop-shadow-md bg-neutral text-lg" :id="column.id">
        <!-- Column Title -->
        <div class="text-xl relative p-10">
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
                      <li><a @click="showTitleInput" class="handle-focus"><PencilSquareIcon class="w-12" role="button" :aria-controls="`column-title-${column.id}`" /> Rename</a></li>
                      <li><a @click="removeColumn()" role="button" :aria-controls="column.id" title="Delete column"><TrashIcon class="w-12" /> Delete</a></li>
                    </ul>
                </div>
            </div>
            <form class="relative" v-if="!!showInput" @submit.prevent="updateColumn">
              <label :for="`column-title-${column.id}`" class="sr-only">Collection title</label>
              <input
                      ref="titleInput"
                      :name="`column-title-${column.id}`"
                      :id="`column-title-${column.id}`"
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
        </div>
        <!-- /Column Title -->
        <!-- Links Container -->
        <div class="relative overflow-y-scroll" style="height: calc(100% - 72px)">
            <div class="w-full grid grid-rows-auto gap-10 overflow-hidden absolute top-0 left-0" v-if="!!column.id">
                <!-- Links -->
                <WorkspaceColumnLink @remove="removeLink" v-for="link in column.links" :link="link"/>
                <!-- /Links -->
                <!-- Add Link Button -->
                <a class="w-full btn btn-neutral rounded-btn text-center btn-lg hover:bg-white hover:bg-opacity-10"
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
    <dialog :id="`${column.id}_add_link`" class="modal" v-if="!!column.id" ref="addLinkModal">
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
