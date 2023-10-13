<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { getRandomId } from "@/tools/randId";

const emit = defineEmits(["update:text"]);

const uuid = getRandomId();
const DOM_ID = `file-editor-${uuid}`;

const props = defineProps<{
  text: string;
  height: string;
}>();

const theme = EditorView.theme({
  ".cm-content": {
    height: props.height
  },
  ".cm-gutters": {
    height: props.height
  },
  ".cm-scroller": {
    overflow: "hidden"
  },
  ".cm-wrap": {
    height: props.height,
    border: "1px solid silver"
  }
});

let editor: EditorView;
const initEditor = () => {
  let startState = EditorState.create({
    doc: props.text,
    extensions: [
      basicSetup,
      // theme,
      javascript(),
      EditorView.updateListener.of(function (e) {
        const text = e.view.state.doc.toString();
        emit("update:text", text);
      })
    ]
  });

  editor = new EditorView({
    state: startState,
    parent: document.getElementById(DOM_ID) as HTMLElement
  });
};

onMounted(() => {
  initEditor();
});

onBeforeUnmount(() => {
  editor?.destroy();
});
</script>

<template>
  <div class="editor-container" :style="{ height }">
    <div :id="DOM_ID" class="file-editor"></div>
  </div>
</template>

<style lang="scss" scoped>
.editor-container {
  overflow: auto;
}
</style>
