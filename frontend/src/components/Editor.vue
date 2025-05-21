<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, watch } from "vue";
import { t } from "@/lang/i18n";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { StreamLanguage, LanguageSupport } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { json } from "@codemirror/lang-json";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { xml } from "@codemirror/lang-xml";
import { getFileExtName } from "@/tools/fileManager";
import { EditorState, Compartment } from "@codemirror/state";
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import { getRandomId } from "@/tools/randId";
import * as yamlMode from "@codemirror/legacy-modes/mode/yaml";
import * as propertiesMode from "@codemirror/legacy-modes/mode/properties";
import * as shellMode from "@codemirror/legacy-modes/mode/shell";
import { useScreen } from "../hooks/useScreen";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { linter } from "@codemirror/lint";
import { jsonParseLinter } from "@codemirror/lang-json";
import { lintGutter } from "@codemirror/lint";

const { isDarkTheme } = useAppConfigStore();
const emit = defineEmits(["update:text"]);
const uuid = getRandomId();
const DOM_ID = `file-editor-${uuid}`;
const { isPhone } = useScreen();

const props = defineProps<{
  text: string;
  height: string;
  filename: string;
}>();

const baseFontSize = isPhone.value ? "14px" : "15px";
const lineHeight = isPhone.value ? "22px" : "24px";

const getLanguageExtension = () => {
  const ext = getFileExtName(props.filename);
  const languagesMap = [
    {
      name: ["js", "jsx", "ts", "tsx", "mjs", "djs"],
      plugin: () => javascript({ jsx: true, typescript: ext === "ts" })
    },
    {
      name: ["json", "json5"],
      plugin: () => [
        json(),
        lintGutter(),
        linter(jsonParseLinter())
      ]
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
      name: ["yaml", "yml", "toml"],
      plugin: () => new LanguageSupport(StreamLanguage.define(yamlMode.yaml))
    },
    {
      name: ["properties", "ini"],
      plugin: () => new LanguageSupport(StreamLanguage.define(propertiesMode.properties))
    },
    {
      name: ["shell", "sh", "bat", "cmd"],
      plugin: () => new LanguageSupport(StreamLanguage.define(shellMode.shell))
    },
    {
      name: ["py", "pyi", "pyw"],
      plugin: () => python()
    }
  ];

  return languagesMap.find(item => item.name.includes(ext))?.plugin() ?? javascript();
};

let editor: EditorView | null = null;
let editableCompartment: Compartment;
const Editable = ref(true);

const initEditor = () => {
  editableCompartment = new Compartment();
  const startState = EditorState.create({
    doc: props.text,
    extensions: [
      basicSetup,
      tokyoNight,
      getLanguageExtension(),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": {
          fontSize: baseFontSize,
          lineHeight: lineHeight,
        },
        ".cm-content": {
          fontSize: baseFontSize,
          lineHeight: lineHeight,
          padding: "0 8px 0 12px!important",
        },
        ".cm-gutters": {
          backgroundColor: "#1a1a1c",
          color: "#666672",
          borderRight: "1px solid #38383a",
          minWidth: "3.2em",
          padding: "0 4px"
        },
        ".cm-gutterElement": {
          padding: "0 4px 0 0",
          justifyContent: "flex-end"
        },
        ".cm-activeLineGutter": {
          backgroundColor: "#2a2a2e",
          color: "#fff"
        },
        ".cm-lineNumbers .cm-gutterElement": {
          fontFamily: "Menlo, Monaco, Consolas, 'Courier New', monospace"
        },
        ".cm-lintRange-error": {
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%206%203'%20enable-background%3D'new%200%200%206%203'%20height%3D'3'%20width%3D'6'%3E%3Cg%20fill%3D'%23dc3545'%3E%3Cpolygon%20points%3D'5.5%2C0%202.5%2C3%201.1%2C3%204.1%2C0'%2F%3E%3Cpolygon%20points%3D'4%2C0%206%2C2%206%2C0.6%205.4%2C0'%2F%3E%3Cpolygon%20points%3D'0%2C2%201%2C3%202.4%2C3%200%2C0.6'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E\")",
          backgroundRepeat: "repeat-x",
          backgroundPosition: "bottom left",
          backgroundSize: "auto 3px"
        }
      }),
      EditorView.updateListener.of((update) => {
        if (!update.changes.empty && Editable.value) {
          emit("update:text", update.state.doc.toString());
        }
      }),
      editableCompartment.of(EditorView.editable.of(Editable.value))
    ]
  });

  const parentElement = document.getElementById(DOM_ID);
  if (!parentElement) {
    console.error(`Editor container #${DOM_ID} not found.`);
    return;
  }
  editor = new EditorView({
    state: startState,
    parent: parentElement,
  });
};

onMounted(initEditor);
onBeforeUnmount(() => editor?.destroy());
watch(Editable, (newVal) => {
  if (editor) {
    editor.dispatch({
      effects: editableCompartment.reconfigure(EditorView.editable.of(newVal))
    });
  }
});
</script>

<template>
  <div class="editor-container">
    <div class="mode-switcher">
      <span class="mode-label">{{ Editable ? 't("读写")' : 't("只读")' }}</span>
      <a-switch 
        v-model:checked="Editable" 
        class="mode-switch"
        size="small"
      />
    </div>
    <div :id="DOM_ID" class="file-editor"></div>
  </div>
</template>

<style lang="scss" scoped>
.editor-container {
  position: relative;
  height: v-bind('props.height');
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  border-radius: 6px;
  overflow: hidden;
  touch-action: pan-y;

  @media (max-width: 768px) {
    height: 60vh;
  }
}

.mode-switcher {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background: rgba(37, 37, 38, 0.95);
  border-radius: 4px;
  backdrop-filter: blur(8px);
  border: 1px solid #3c3c3c;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  
  .mode-label {
    font-size: 12px;
    color: #d4d4d4;
    line-height: 1;
    font-weight: 500;
  }
  
  .mode-switch {
    :deep(.ant-switch) {
      width: 40px;
      min-width: 40px;
      background: #3c3c3c;
    }
    :deep(.ant-switch-checked) {
      width: 40px;
      min-width: 40px;
      background: #1890ff;
    }
    :deep(.ant-switch-handle) {
      width: 16px;
      height: 16px;
      &::before {
        border-radius: 8px;
      }
    }
  }
}

.file-editor {
  flex: 1;
  overflow: hidden;
  -webkit-overflow-scrolling: touch;
  overflow: auto;
  
  @media (max-width: 768px) {
    .cm-content {
      min-height: calc(100% + 100px);
      padding: 0 8px 0 8px!important;
    }
    .cm-gutters {
      font-size: 13px!important;
    }
  }
}

@media (max-width: 768px) {
  .editor-container {
    border-radius: 0;
  }
  
  .file-editor {
    font-size: 14px !important;
    line-height: 22px !important;
    
    .cm-gutters {
      font-size: 13px !important;
    }
  }
}
</style>