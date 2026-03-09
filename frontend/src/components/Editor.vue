<script setup lang="ts">
import { getFileExtName } from "@/tools/fileManager";
import { getRandomId } from "@/tools/randId";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { xml } from "@codemirror/lang-xml";
import { LanguageSupport, StreamLanguage } from "@codemirror/language";
import * as propertiesMode from "@codemirror/legacy-modes/mode/properties";
import * as shellMode from "@codemirror/legacy-modes/mode/shell";
import * as yamlMode from "@codemirror/legacy-modes/mode/yaml";
import { linter, lintGutter } from "@codemirror/lint";
import { EditorState, StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tokyoNight } from "@uiw/codemirror-theme-tokyo-night";
import { basicSetup } from "codemirror";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useScreen } from "../hooks/useScreen";

const emit = defineEmits(["update:text"]);
const uuid = getRandomId();
const DOM_ID = `file-editor-${uuid}`;
const { isPhone } = useScreen();

const props = defineProps<{
  text: string;
  height: string;
  filename: string;
}>();

const editorContainer = ref<HTMLElement>();
let startDistance = 0;
let startScale = 1;
const MAX_SCALE = 1.25;
const MIN_SCALE = 0.4;
const baseFontSize = isPhone.value ? 12 : 15;
const baseLineHeight = isPhone.value ? 16 : 22;
const currentFontSize = ref(baseFontSize);
const currentLineHeight = ref(baseLineHeight);
let scale = 1;
let animationFrameId = 0;

const jsonLintExtensions = [lintGutter(), linter(jsonParseLinter())];

const getLanguageExtension = () => {
  const ext = getFileExtName(props.filename);
  const isJSON = ["json", "json5"].includes(ext);

  const languagesMap = [
    { name: ["json", "json5"], plugin: () => [json(), ...(isJSON ? jsonLintExtensions : [])] },
    {
      name: ["js", "jsx", "ts", "tsx", "mjs", "djs"],
      plugin: () => [javascript({ jsx: true, typescript: ext === "ts" })]
    },
    { name: ["xml"], plugin: () => [xml()] },
    { name: ["css", "less", "scss"], plugin: () => [css()] },
    { name: ["html", "vue"], plugin: () => [html()] },
    {
      name: ["yaml", "yml", "toml"],
      plugin: () => [new LanguageSupport(StreamLanguage.define(yamlMode.yaml))]
    },
    {
      name: ["properties", "ini"],
      plugin: () => [new LanguageSupport(StreamLanguage.define(propertiesMode.properties))]
    },
    {
      name: ["shell", "sh", "bat", "cmd"],
      plugin: () => [new LanguageSupport(StreamLanguage.define(shellMode.shell))]
    },
    { name: ["py", "pyi", "pyw"], plugin: () => [python()] }
  ];

  return languagesMap.find((item) => item.name.includes(ext))?.plugin() ?? [javascript()];
};

let editor: EditorView | null = null;

const createThemeExtension = () => {
  return EditorView.theme({
    "&": {
      fontSize: `${currentFontSize.value}px`,
      lineHeight: `${currentLineHeight.value}px`,
      "--cm-lint-marker-error-color": "#dc3545"
    },
    ".cm-content": {
      fontSize: `${currentFontSize.value}px`,
      lineHeight: `${currentLineHeight.value}px`,
      "border-left": "1px solid #fbfbfb"
    },
    ".cm-gutters": {
      backgroundColor: "#1a1a1c",
      color: "#666672",
      fontSize: `${currentFontSize.value}px`,
      minWidth: `${currentFontSize.value * 3}px`
    }
  });
};

const baseExtensions = [
  basicSetup,
  tokyoNight,
  EditorView.lineWrapping,
  EditorView.updateListener.of((update) => {
    if (!update.changes.empty) emit("update:text", update.state.doc.toString());
  })
];

const updateEditor = () => {
  if (!editor) return;
  editor.dispatch({
    effects: StateEffect.reconfigure.of([
      ...baseExtensions,
      ...getLanguageExtension(),
      createThemeExtension()
    ])
  });
};

const initEditor = () => {
  const startState = EditorState.create({
    doc: props.text,
    extensions: [...baseExtensions, ...getLanguageExtension(), createThemeExtension()]
  });

  const parentElement = document.getElementById(DOM_ID);
  if (!parentElement) return;
  editor = new EditorView({ state: startState, parent: parentElement });
};

const handleTouchMove = (e: TouchEvent) => {
  if (e.touches.length === 2 && editorContainer.value) {
    e.preventDefault();
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(() => {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

      if (startDistance > 0) {
        const scaleFactor = currentDistance / startDistance;
        const newScale = startScale * scaleFactor;
        scale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);

        currentFontSize.value = Math.round(baseFontSize * scale);
        currentLineHeight.value = Math.round(baseLineHeight * scale);

        updateEditor();
      }
    });
  }
};

const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 2) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    startDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    startScale = scale;
  }
};

const handleTouchEnd = () => {
  startDistance = 0;
  cancelAnimationFrame(animationFrameId);
};

onMounted(() => {
  initEditor();
  const container = editorContainer.value;
  if (container) {
    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchEnd);
  }
});

onBeforeUnmount(() => {
  const container = editorContainer.value;
  if (container) {
    container.removeEventListener("touchstart", handleTouchStart);
    container.removeEventListener("touchmove", handleTouchMove);
    container.removeEventListener("touchend", handleTouchEnd);
    container.removeEventListener("touchcancel", handleTouchEnd);
  }
  if (editor) {
    editor.destroy();
    editor = null;
  }
  cancelAnimationFrame(animationFrameId);
});
</script>

<template>
  <div class="editor-wrapper">
    <div ref="editorContainer" class="editor-container">
      <div :id="DOM_ID" class="file-editor"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.editor-wrapper {
  height: v-bind("props.height");
  overflow: auto;
  background: #1e1e1e;
  border-radius: 6px;
  touch-action: pan-y;

  @media (max-width: 768px) {
    height: v-bind("props.height || '60vh'");
    border-radius: 0;
  }
}

.editor-container {
  min-height: 100%;
  transform-origin: 0 0;
}

.file-editor {
  :deep(.cm-editor) {
    min-height: v-bind("props.height");
    transition: font-size 0.1s ease-out;
  }

  :deep(.cm-lint-marker-error) {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23dc3545'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/%3E%3C/svg%3E");
    width: calc(1em * 1.2);
    height: calc(1em * 1.2);
    background-size: contain;
    margin-left: 0.2em;
    transition: all 0.1s ease-out;
  }

  :deep(.cm-lintRange-error) {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 3'%3E%3Cg fill='%23dc3545'%3E%3Cpolygon points='5.5,0 2.5,3 1.1,3 4.1,0'/%3E%3Cpolygon points='4,0 6,2 6,0.6 5.4,0'/%3E%3Cpolygon points='0,2 1,3 2.4,3 0,0.6'/%3E%3C/g%3E%3C/svg%3E");
    background-position: bottom left;
    background-repeat: repeat-x;
    background-size: auto calc(0.15em + 1px);
  }
}
</style>
