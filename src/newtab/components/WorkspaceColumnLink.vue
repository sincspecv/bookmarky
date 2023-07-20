<script setup lang="ts">
import * as browser from "webextension-polyfill"
import { computed, onMounted, ref } from "vue"
import isURL from "validator/es/lib/isURL"

// Icons
import { TrashIcon } from '@heroicons/vue/24/outline'
import { PauseCircleIcon } from '@heroicons/vue/24/outline'
import { EllipsisVerticalIcon } from '@heroicons/vue/24/solid'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'

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
        class="bg-neutral hover:drop-shadow-lg w-full min-w-0 p-10 rounded-md flex flex-col flex-nowrap justify-start items-center gap-5 hover:z-10"
    >
        <div class="flex justify-start flex-nowrap gap-5 w-full max-w-full" @click.prevent.self="openLink">
            <div class="avatar" @click.prevent="openLink">
                <figure class="w-20 rounded">
                    <img class="!object-contain" :src="props.link.favIconUrl" v-if="props.link.favIconUrl" />
                </figure>
            </div>
            <div class="flex flex-col text-left overflow-hidden"  @click.prevent="openLink">
                <h3 class="normal-case text-bold text-sm truncate text-ellipses">{{props.link.title}}</h3>
                <span class="normal-case text-xs overflow-hidden truncate text-ellipses">{{props.link.url}}</span>
            </div>
            <div class="dropdown dropdown-bottom dropdown-end h-auto ml-auto mr-0 self-center">
                <label
                    tabindex="0"
                    class="btn btn-ghost px-3 hover:btn-neutral btn-sm opacity-25 hover:opacity-100"
                >
                    <EllipsisVerticalIcon class="w-12" />
                </label>
                <ul tabindex="0" class="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-48">
                    <li><a @click.stop="openLinkInNewTab"><ArrowTopRightOnSquareIcon class="w-12" /> Open in new tab</a></li>
                    <li><a @click="removeLink" role="button" :aria-controls="props.link.id" title="Delete column"><TrashIcon class="w-12" /> Delete</a></li>
                    <li  v-if="hasOpenTabs"><a @click="discardTabs" role="button" :aria-controls="props.link.id" title="Put tabs with this URL loaded to sleep"><PauseCircleIcon class="w-12" /> Sleep open tabs</a></li>
                </ul>
            </div>
        </div>
    </button>
    <!-- /Link -->
</template>

<style scoped>

</style>
