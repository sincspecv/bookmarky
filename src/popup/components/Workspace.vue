<script setup lang="ts">
import type { Workspace, Column, Link } from "~lib/interfaces"
import type { App, Ref } from "vue"
import { ref, computed } from "vue"
import * as browser from "webextension-polyfill"
import useWorkspacesStorage from "~database";
import { useRxStore } from "~stores/useRxStore";

import {ArrowTopRightOnSquareIcon, PauseCircleIcon, TrashIcon} from "@heroicons/vue/24/outline";
import {EllipsisVerticalIcon} from "@heroicons/vue/24/solid";

const workspacesStore = useRxStore()
const db = await useWorkspacesStorage()

const workspaces : Ref<Workspace[]> = ref(await db.workspaces.find().sort({created: "asc"}).exec())
const workspace : Ref<Workspace> = ref(await workspacesStore.getActiveWorkspace)
const columns : Ref<Column[]> = ref(await db.columns.find({ selector: { workspace: workspace.value?._id } }).sort({created: "asc"}).exec())
const activeColumn : Ref<Column> = ref(columns.value.find((i) => i !== undefined))

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
