<script setup lang="ts">
  import { watch, ref, onMounted, toRef } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { v4 as uuidv4 } from "uuid"
  import {storeToRefs} from "pinia";
  import { useRxStore } from "~stores/useRxStore";
  import useWorkspacesStorage from "~database";
  import { cloneDeep } from "lodash-es"

  // Editor.js
  import EditorJS from '@editorjs/editorjs';
  import Header from '@editorjs/header';
  import List from '@editorjs/list';
  import NestedList from '@editorjs/nested-list';
  import AlignmentTuneTool from 'editorjs-text-alignment-blocktune'
  import Paragraph from '@editorjs/paragraph';
  import Checklist from '@editorjs/checklist';

  // Icons
  import { PlusIcon } from '@heroicons/vue/24/solid'
  import {Ref} from "vue/dist/vue";
  import {Column} from "~lib/App";
  import {RxColumnDocument} from "~lib/RxDB";

  // Collect our props from the parent component
  const props = defineProps(['isInView', 'workspaceId'])

  const router = useRouter()
  const route = useRoute()
  const workspacesStore = useRxStore()
  const db = await useWorkspacesStorage()

  const { activeWorkspace } = storeToRefs(workspacesStore)
  const workspaces = ref(await db.workspaces.find().sort({created: "asc"}).exec())
  const isInView = toRef(props, 'isInView')
  const editor = ref(null)

  const note : Ref<RxColumnDocument[]> = ref(await db.notes.findOne({ selector: { workspace: props.workspaceId } }).exec())

  if(!note.value) {
      await db.notes.insert({
          _id: uuidv4(),
          workspace: props.workspaceId,
          noteData: {},
          created: Date.now()
      })

      note.value = await db.notes.findOne({ selector: { workspace: props.workspaceId } }).exec()
  }

  // Update our ref so that RxDB doesn't complain when saving
  note.value.$.subscribe(doc => {
      note.value = doc
  })

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
              paragraph: {
                  class: Paragraph,
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
              checklist: {
                  class: Checklist,
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

          data: note.value.noteData,

          onChange: (api, event) => {
              api.saver.save()
              .then((noteData) => {
                  note.value.incrementalPatch({
                      noteData: cloneDeep(noteData)
                  })
              })
          }
      });

      editor.value.isReady
          .then(() => {
              // Focus on the editor when it is in view
              watch(isInView, (isInView) => {
                  if(isInView) {
                      editor.value.focus()
                  }
              })
          })
          .catch((reason) => {
              console.log(`Editor.js initialization failed because of ${reason}`)
          });
  })

</script>

<template>
  <div class="w-full h-full px-10 py-24 rounded-lg drop-shadow-md bg-white text-black text-md">
      <div :id="`${props.workspaceId}-workspace-editor`"></div>
  </div>
</template>

<style scoped>

</style>
