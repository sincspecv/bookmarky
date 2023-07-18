<script setup lang="ts">
import * as browser from "webextension-polyfill"
import { reactive, ref, onMounted } from "vue"
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome"

const props = defineProps(['link'])

</script>

<template>
    <!-- Link -->
    <button class="bg-neutral hover:drop-shadow-md min-w-0 p-10 rounded-md flex flex-col flex-nowrap justify-start items-center gap-5 hover:z-10">
        <div class="flex justify-start flex-nowrap gap-5 max-w-full">
            <div class="avatar">
                <figure class="w-20 rounded" v-if="props.link.favIconUrl">
                    <img :src="props.link.favIconUrl" />
                </figure>
            </div>
            <div class="flex flex-col text-left overflow-hidden">
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
                <ul tabindex="0" class="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-content">
                    <li><a @click="console.log('clicked')"><font-awesome-icon icon="far fa-edit" role="button" :aria-controls="`column-title-${props.link.id}`"></font-awesome-icon> Rename</a></li>
                    <li><a @click="console.log('clicked')" role="button" :aria-controls="props.link.id" title="Delete column"><font-awesome-icon icon="far fa-trash-alt"></font-awesome-icon> Delete</a></li>
                </ul>
            </div>
        </div>
    </button>
    <!-- /Link -->
</template>

<style scoped>

</style>