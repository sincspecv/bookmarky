<script setup lang="ts">
import * as browser from "webextension-polyfill"
import { computed, onMounted, ref } from "vue"
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome"
import isURL from "validator/es/lib/isURL"

const emits = defineEmits(['remove'])

const props = defineProps(['link'])
const currentTab = await browser.tabs.getCurrent();
const openTabs = ref(await browser.tabs.query({currentWindow: true, url: [props.link.url]}))
const hasOpenTabs = computed(() => !!openTabs.value.length)

const isURLOptions = {
    protocols: ['http', 'https', 'file'],
    require_protocol: true,
    allow_underscores: true,
}

// Keep our open tab list updated when they change
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    openTabs.value = await browser.tabs.query({currentWindow: true, url: [props.link.url]})
})

const openLink = () => {
    browser.tabs.update(currentTab.id,{
        url: props.link.url
    })
}

const openLinkInNewTab = () => {
    browser.tabs.create({
        url: props.link.url
    })
}

const removeLink = () => {
    emits('remove', props.link.id)
}

const discardTabs = async () => {
    if(!!openTabs.value.length) {
        openTabs.value.forEach(tab => {
            console.log(`Discarded tab ${tab.id}`)
        })
    }
}

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

</script>

<template>
    <!-- Link -->
    <button
        @click.prevent.self="openLink"
        class="bg-neutral hover:drop-shadow-lg min-w-0 p-10 rounded-md flex flex-col flex-nowrap justify-start items-center gap-5 hover:z-10"
    >
        <div class="flex justify-start flex-nowrap gap-5 max-w-full" @click.prevent.self="openLink">
            <div class="avatar" @click.prevent="openLink">
                <figure class="w-20 rounded" v-if="props.link.favIconUrl">
                    <img class="!object-contain" :src="props.link.favIconUrl" />
                </figure>
            </div>
            <div class="flex flex-col text-left overflow-hidden"  @click.prevent="openLink">
                <h3 class="normal-case text-bold text-sm truncate text-ellipses">{{props.link.title}}</h3>
                <span class="normal-case text-xs overflow-hidden truncate text-ellipses">{{props.link.url}}</span>
            </div>
            <div class="dropdown dropdown-bottom dropdown-end h-auto self-center">
                <label
                    tabindex="0"
                    class="btn btn-ghost hover:btn-neutral btn-sm opacity-25 hover:opacity-100"
                >
                    <font-awesome-icon icon="fas fa-ellipsis-v"></font-awesome-icon>
                </label>
                <ul tabindex="0" class="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-48">
                    <li><a @click.stop="openLinkInNewTab"><font-awesome-icon icon="fas fa-external-link-alt" class="w-12"></font-awesome-icon> Open in new tab</a></li>
                    <li><a @click="removeLink" role="button" :aria-controls="props.link.id" title="Delete column"><font-awesome-icon icon="far fa-trash-alt"  class="w-12"></font-awesome-icon> Delete</a></li>
                    <li  v-if="hasOpenTabs"><a @click="discardTabs" role="button" :aria-controls="props.link.id" title="Put tab to sleep"><font-awesome-icon icon="far fa-pause-circle" class="w-12"></font-awesome-icon> Sleep open tabs</a></li>
                </ul>
            </div>
        </div>
    </button>
    <!-- /Link -->
</template>

<style scoped>

</style>
