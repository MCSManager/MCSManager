<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { EditorView, basicSetup } from "codemirror";
import { StreamLanguage, LanguageSupport } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { xml } from "@codemirror/lang-xml";
import { getFileExtName } from "@/tools/fileManager";
import { EditorState } from "@codemirror/state";
import { getRandomId } from "@/tools/randId";
import * as yamlMode from "@codemirror/legacy-modes/mode/yaml";
import * as propertiesMode from "@codemirror/legacy-modes/mode/properties";
import * as shellMode from "@codemirror/legacy-modes/mode/shell";

const emit = defineEmits(["update:text"]);

const uuid = getRandomId();
const DOM_ID = `file-editor-${uuid}`;

const props = defineProps<{
  text: string;
  height: string;
  filename: string;
}>();

const theme = EditorView.theme({
  ".cm-gutters": {
    height: props.height
  },
  ".cm-scroller": {
    overflow: "hidden"
  }
  // ".cm-content": {
  //   height: props.height
  // },
  // ".cm-wrap": {
  //   height: props.height,
  //   border: "1px solid silver"
  // }
});

const getLanguageExtension = () => {
  const ext = getFileExtName(props.filename);
  const languagesMap = [
    {
      name: ["js", "jsx", "ts", "tsx", "mjs", "djs"],
      plugin: () => javascript()
    },
    {
      name: ["json", "json5"],
      plugin: () => json()
    },
    {
      name: ["xml"],
      plugin: () => xml()
    },
    {
      name: ["css", "less", "scss"],
      plugin: () => css()
    },
    {
      name: ["html", "vue"],
      plugin: () => html()
    },
    {
      name: ["yaml", "yml"],
      plugin: () => new LanguageSupport(StreamLanguage.define(yamlMode.yaml))
    },
    {
      name: ["properties", "ini"],
      plugin: () => new LanguageSupport(StreamLanguage.define(propertiesMode.properties))
    },
    {
      name: ["shell", "sh", "bat", "cmd"],
      plugin: () => new LanguageSupport(StreamLanguage.define(shellMode.shell))
    }
  ];

  const info = languagesMap.filter((item) => item.name.includes(ext))?.[0];
  if (!info) return null;
  return info?.plugin();
};

let editor: EditorView;
const initEditor = () => {
  const extLang = getLanguageExtension();
  const startState = EditorState.create({
    doc: props.text,
    extensions: [
      basicSetup,
      theme,
      extLang ? extLang : javascript(),
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
