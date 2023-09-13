<script setup lang="ts">
  import { watch, ref, onMounted, nextTick } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { v4 as uuidv4 } from "uuid"
  import {storeToRefs} from "pinia";
  import { useRxStore } from "~stores/useRxStore";
  import useWorkspacesStorage from "~database";

  // Editor.js
  import EditorJS from '@editorjs/editorjs';
  import Header from '@editorjs/header';
  import List from '@editorjs/list';
  import NestedList from '@editorjs/nested-list';
  import AlignmentTuneTool from 'editorjs-text-alignment-blocktune'
  import Paragraph from '@editorjs/paragraph';

  // Icons
  import { PlusIcon } from '@heroicons/vue/24/solid'

  // Collect our props from the parent component
  const props = defineProps(['workspaceId'])

  const router = useRouter()
  const route = useRoute()
  const workspacesStore = useRxStore()
  const db = await useWorkspacesStorage()

  const { activeWorkspace } = storeToRefs(workspacesStore)
  const workspaces = ref(await db.workspaces.find().sort({created: "asc"}).exec())
  const editor = ref(null)

  onMounted(() => {
      editor.value = new EditorJS({
          holder: `${props.workspaceId}-workspace-editor`,

          /**
           * Available Tools list.
           * Pass Tool's class or Settings object for each Tool you want to use
           * @see https://github.com/editor-js/awesome-editorjs#text-and-typography
           */
          tools: {
              header: {
                  class: Header,
                  inlineToolbar: true,
                  tunes: ['anyTuneName'],
              },
              list: {
                  class: NestedList,
                  inlineToolbar: true,
                  tunes: ['anyTuneName'],
                  config: {
                      defaultStyle: 'unordered'
                  },
              },
              paragraph: {
                  class: Paragraph,
                  inlineToolbar: true,
                  tunes: ['anyTuneName'],
              },
              anyTuneName: {
                  class: AlignmentTuneTool,
                  config:{
                      default: "left",
                      blocks: {
                          header: 'left',
                          list: 'left'
                      }
                  },
              }
          },
      });

      editor.value.isReady
          .then(() => {
              console.log('Editor.js is ready to work!')
          })
          .catch((reason) => {
              console.log(`Editor.js initialization failed because of ${reason}`)
          });
  })
</script>

<template>
  <div class="w-full h-full p-10 rounded-lg drop-shadow-md bg-neutral text-lg">
      <div :id="`${props.workspaceId}-workspace-editor`"></div>
  </div>
</template>

<style scoped>

</style>
