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
const columns : Column[] = await storage.getActiveColumns();
const activeColumn : Ref<Column> = ref(columns.find((i) => i !== undefined))

const openLink = (link : Link) => {
    browser.tabs.create({
        url: link.url
    })
}

const changeActiveColumn = async (column : Column = {}) => {
    // activeColumn.value = column
    console.log(column)
    console.log(activeColumn.value)
}
</script>

<template>
    <select class="select select-bordered w-full rounded-none" v-model="activeColumn">
        <option v-for="column in columns" :value="column">{{column.title}}</option>
    </select>
    <button class="btn btn-lg py-4 flex justify-start flex-nowrap gap-5 w-full max-w-full" v-for="link in activeColumn.links" @click.prevent="openLink(link)">
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
</template>

<style scoped>

</style>
