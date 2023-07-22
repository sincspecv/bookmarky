<script setup lang="ts">
import type { Workspace, Column, Link } from "~lib/interfaces"
import type { App, Ref } from "vue"
import { ref, computed } from "vue"
import { useWorkspaceStorage } from "~lib/useWorkspaceStorage"
import * as browser from "webextension-polyfill"
import {ArrowTopRightOnSquareIcon, PauseCircleIcon, TrashIcon} from "@heroicons/vue/24/outline";
import {EllipsisVerticalIcon} from "@heroicons/vue/24/solid";

const storage = useWorkspaceStorage()
const workspaces : Ref<Workspace[]> = computed(() => storage.getWorkspaces())
const workspace : Workspace = await storage.getActiveWorkspace()
const columns : Column[] = await storage.getActiveColumns();
const activeColumn : Ref<Column> = ref(columns.find((i) => i !== undefined))

const openLink = (link : Link) => {
    browser.tabs.create({
        url: link.url
    })
}
</script>

<template>
    <h1 class="text-lg font-medium p-10" v-html="workspace.name"></h1>

    <div v-if="!!activeColumn">
        <!-- Column Select -->
        <select class="select select-bordered w-full rounded-none" v-model="activeColumn">
            <option v-for="column in columns" :value="column">{{column.title}}</option>
        </select>
        <!-- /Column Select -->

        <!-- Links -->
        <button class="btn btn-lg py-4 flex justify-start flex-nowrap gap-5 w-full max-w-full" v-for="link in activeColumn.links" @click.prevent="openLink(link)" v-if="!!activeColumn.links.length">
            <div class="avatar">
                <figure class="w-20 rounded">
                    <img class="!object-contain" :src="link.favIconUrl" v-if="link.favIconUrl" />
                </figure>
            </div>
            <div class="flex flex-col text-left overflow-hidden">
                <h3 class="normal-case text-bold text-sm truncate text-ellipses">{{link.title}}</h3>
                <span class="normal-case text-xs overflow-hidden truncate text-ellipses">{{link.url}}</span>
            </div>
        </button>
        <!-- /Links -->

        <!-- No Links -->
        <div class="p-10" v-if="!activeColumn.links.length">
            <p class="text-md">No Links in this collection</p>
        </div>
        <!-- /No Links -->
    </div>

    <!-- No Columns -->
    <div class="p-10" v-if="!activeColumn">
        <p class="text-md">No collections in this workspace</p>
    </div>
    <!-- /No Columns -->
</template>

<style scoped>

</style>
