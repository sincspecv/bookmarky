<script setup lang="ts">
import * as browser from "webextension-polyfill"
import { reactive, ref, onMounted } from "vue"
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome"
import { v4 as uuidv4 } from "uuid"
import { Storage } from "@plasmohq/storage"
import * as _ from "lodash-es"
import {useRoute, useRouter} from "vue-router";
import WorkspaceColumnLink from "./WorkspaceColumnLink"
import * as cheerio from "cheerio"

const router = useRouter()
const route = useRoute()

// Get our browser tabs
const browserTabs = ref(await browser.tabs.query({currentWindow: true, url: ["https://*/*", "http://*/*", "file://*/*"]}))

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    browserTabs.value = await browser.tabs.query({currentWindow: true, url: ["https://*/*", "http://*/*", "file://*/*"]});
    console.log(browserTabs.value)
})

// Collect our props from the parent component
const props = defineProps(['workspace', 'column'])

// And our emits
const emits = defineEmits(['update'])

// Make sure we have a workspace and redirect if not
if(!props.workspace) {
    router.push({name: "create-workspace", replace: true})
}

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

    showInput.value = false;
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

const showTitleInput = () => {
    showInput.value = true;

    /**
     * TODO: Fix error when trying to focus on input
     */
    // titleInput.value.focus();
}

const hideTitleInput = () => {
    // Make sure there is an actual value in the input
    if(!!column.title) {
        showInput.value = false
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
    addLinkModal.value.close()
}

// Add a link from the selection of tabs
const addTabLink = (tab = {}) => {
    const link = {
        id: uuidv4(),
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl,
        description: "",
        createdOn: Date.now(),
    }

    column.links.push(link);
    emits('update', props.workspace)
    closeAddLinkModal();
}

// Add a manually entered URL to the link list
const addTextLink = async () => {
    if (!!textLink.url) {
        const html = await fetch(textLink.url).then(response => response.text())
        const $ = cheerio.load(html);

        textLink.title = $('title').text()
        textLink.description = $('meta[name*="description"]').attr('content')
        textLink.favIconUrl = $('link[rel*="icon"]').attr('href')

        if(!textLink.favIconUrl.startsWith("http")) {
            const baseURL = textLink.url.split("/")[2]
            textLink.favIconUrl = `https://${baseURL}${textLink.favIconUrl}`
        }

        console.log("Title: ", textLink.title)
        console.log("Meta Description: ", textLink.description)
        console.log("Favicon: ", textLink.favIconUrl)

        const link = {
            id: uuidv4(),
            title: textLink.title,
            url: textLink.url,
            favIconUrl: textLink.favIconUrl,
            description: textLink.description,
            createdOn: Date.now(),
        }
        
        column.links.push(link);
        emits('update', props.workspace)
        closeAddLinkModal()
    }
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
    <!-- Column Title -->
    <div class="w-[21.378rem] h-full p-10 rounded-box drop-shadow-md bg-neutral text-lg" :id="column.id">
        <div class="text-xl relative p-10">
            <div class="flex flex-row justify-between content-center" v-if="!showInput">
                <h2>{{column.title}}</h2>
                <div class="dropdown dropdown-bottom dropdown-end h-full">
                    <label
                      tabindex="0"
                      class="btn btn-ghost hover:btn-neutral btn-sm opacity-25 hover:opacity-100"
                    >
                      <font-awesome-icon icon="fas fa-ellipsis-v"></font-awesome-icon>
                    </label>
                    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-content">
                      <li><a @click="showTitleInput"><font-awesome-icon icon="far fa-edit" role="button" :aria-controls="`column-title-${column.id}`"></font-awesome-icon> Rename</a></li>
                      <li><a @click="removeColumn()" role="button" :aria-controls="column.id" title="Delete column"><font-awesome-icon icon="far fa-trash-alt"></font-awesome-icon> Delete</a></li>
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
                  <font-awesome-icon icon="fas fa-sign-in-alt"></font-awesome-icon>
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
                    <font-awesome-icon icon="fas fa-plus" class="mx-auto"></font-awesome-icon>
                    <span class="sr-only">Add new link</span>
                </a>
                <!-- /Add Link Button -->
            </div>
        </div>
        <!-- /Links Container -->
    </div>

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
