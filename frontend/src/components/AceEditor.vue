<script setup lang="ts">
import { h, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import * as ace from "ace-builds";
import type { Ace } from "ace-builds";
import "ace-builds/src-noconflict/ext-themelist";
import "ace-builds/src-noconflict/ext-modelist";
import "ace-builds/src-noconflict/ext-beautify";
import _ from "lodash";
import {
  CheckCircleOutlined,
  DownOutlined,
  InfoCircleOutlined,
  RedoOutlined,
  SaveOutlined
} from "@ant-design/icons-vue";
import { useLocalStorage } from "@vueuse/core";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { t } from "@/lang/i18n";

interface EditorOptions extends Ace.EditorOptions {
  formatOnSave: boolean;
  themeLight: string;
  themeDark: string;
}

const props = defineProps<{
    text: string;
    mode?: string;
    height?: string;
    filename: string;
  }>(),
  emit = defineEmits(["update:text", "saveFile"]),
  { isDarkTheme } = useAppConfigStore(),
  cText = ref<string>(""),
  editorEle = ref<HTMLElement | null>(),
  editor = ref<Ace.Editor>(),
  eSetVisible = ref(false),
  isEditing = ref(false),
  options = reactive<Partial<EditorOptions>>({
    wrap: true,
    behavioursEnabled: true,
    highlightActiveLine: true,
    readOnly: false,
    showInvisibles: true,
    enableMultiselect: true,
    showLineNumbers: true,
    enableBasicAutocompletion: true,
    fontSize: 14,
    theme: "ace/theme/tomorrow",
    themeLight: "ace/theme/tomorrow",
    themeDark: "ace/theme/monokai",
    mode: "ace/mode/" + (props.mode ? props.mode : "text"),
    formatOnSave: true,
    showPrintMargin: false
  }),
  localOpt = useLocalStorage<string>("EditorOpts", JSON.stringify(options)),
  themes = ace.require("ace/ext/themelist").themes,
  modes = ace.require("ace/ext/modelist").modes,
  exts: Record<string, string> = {
    js: "javascript",
    md: "markdown",
    yml: "yaml",
    py: "python",
    ts: "typescript",
    txt: "text",
    bat: "batchfile",
    cmd: "batchfile",
    go: "golang",
    c: "c_cpp",
    h: "c_cpp",
    conf: "apache_conf"
  },
  beautify = ace.require("ace/ext/beautify"),
  updateText = () => emit("update:text", editor.value?.getValue()),
  save = (fromHotkey?: boolean) => {
    updateText();
    emit("saveFile", { fromHotkey });
    isEditing.value = false;
  },
  reset = () => editor.value?.setValue(_.clone(cText.value)),
  destroy = () => editor.value?.setValue(""),
  setOpts = (get?: boolean) => {
    if (get) {
      if (isDarkTheme()) options.theme = options.themeDark;
      else options.theme = options.themeLight;
    } else {
      if (isDarkTheme()) options.themeDark = options.theme;
      else options.themeLight = options.theme;
    }

    editor.value?.setOptions(options);
    localOpt.value = JSON.stringify(options);
  },
  eSets: { name: string; key: keyof EditorOptions }[] = [
    {
      name: t("TXT_CODE_8918574b"),
      key: "wrap"
    },
    {
      name: t("TXT_CODE_efc75aa3"),
      key: "behavioursEnabled"
    },
    {
      name: t("TXT_CODE_8cedf1ad"),
      key: "formatOnSave"
    },
    {
      name: t("TXT_CODE_51a2e7a9"),
      key: "highlightActiveLine"
    },
    {
      name: t("TXT_CODE_34f6be8a"),
      key: "readOnly"
    },
    {
      name: t("TXT_CODE_31fb3585"),
      key: "showInvisibles"
    },
    {
      name: t("TXT_CODE_629d3605"),
      key: "enableMultiselect"
    },
    {
      name: t("TXT_CODE_8d2b48ec"),
      key: "showLineNumbers"
    }
  ],
  filterOption = (input: string, option: any) =>
    option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0,
  formatCode = () => beautify.beautify(editor.value?.session);

defineExpose({
  destroy,
  updateText,
  isEditing
});

onMounted(() => {
  if (localOpt.value) Object.assign(options, JSON.parse(localOpt.value));
  cText.value = _.clone(props.text);
  ace.config.set("basePath", "/assets/editor");
  editor.value = ace.edit(editorEle.value ?? "");
  editor.value.on("change", () => (isEditing.value = true));
  editor.value.commands.addCommands([
    {
      name: "saveFile",
      bindKey: {
        win: "Ctrl-S",
        mac: "Command-S"
      },
      exec: () => {
        options.formatOnSave && formatCode();
        save(true);
      }
    },
    {
      name: "formatCode",
      bindKey: {
        win: "Ctrl-Alt-F"
      },
      exec: () => {
        formatCode();
      }
    }
  ]);

  options.mode = props.mode ? "ace/mode/" + props.mode : options.mode;
  const extName = props.filename.split(".").pop();
  if (extName) options.mode = "ace/mode/" + (exts[extName] ?? extName);

  setOpts(true);
  editor.value.setValue(props.text);
  editor.value.moveCursorTo(0, 0);
  formatCode();
});

onBeforeUnmount(() => {
  destroy();
});
</script>

<template>
  <a-space size="middle" align="center" wrap class="mb-10">
    <a-button
      class="btn-has-icon"
      type="primary"
      :disabled="!isEditing"
      :icon="h(SaveOutlined)"
      size="middle"
      @click="save()"
    >
      {{ t("TXT_CODE_abfe9512") }}
    </a-button>

    <a-popconfirm :title="t('TXT_CODE_d7e538a')" @confirm="reset">
      <a-button class="btn-has-icon" size="middle" type="dashed" :icon="h(RedoOutlined)">
        {{ t("TXT_CODE_1172896") }}
      </a-button>
    </a-popconfirm>

    <a-dropdown v-model:open="eSetVisible">
      <template #overlay>
        <a-menu>
          <a-menu-item v-for="(item, i) in eSets" :key="i" @click="setOpts()">
            <a-switch v-model:checked="(options as any)[item.key]" class="mr-2" size="small" />
            {{ item.name }}
          </a-menu-item>
        </a-menu>
      </template>
      <a-button class="btn-has-icon" size="middle">
        {{ t("TXT_CODE_ab91f373") }}
        <DownOutlined />
      </a-button>
    </a-dropdown>

    <a-select
      v-model:value="options.theme"
      :options="themes.map((t: any) => ({ label: t.caption, value: t.theme }))"
      :placeholder="t('TXT_CODE_5844b301')"
      size="middle"
      show-search
      :filter-option="filterOption"
      @change="setOpts()"
    >
      <template #optionLabel="o"> {{ t("TXT_CODE_12055c4b") }}: {{ o.label ?? "" }} </template>
    </a-select>

    <a-select
      v-model:value="options.mode"
      :options="modes.map((t: any) => ({ label: t.name, value: t.mode }))"
      :filter-option="filterOption"
      :placeholder="t('TXT_CODE_60752a40')"
      size="middle"
      show-search
      style="min-width: 60px; max-width: 160px"
      @change="setOpts()"
    >
      <template #optionLabel="o">
        {{ t("TXT_CODE_2a34c50a") }}: {{ o ? (o.label ? o.label : "") : "" }}
      </template>
    </a-select>

    <a-input-number
      v-model:value="options.fontSize"
      :addon-before="t('TXT_CODE_630d19e1')"
      addon-after="px"
      style="min-width: 60px; max-width: 180px"
      size="middle"
      @change="setOpts()"
    ></a-input-number>

    <a-tag v-if="isEditing" color="orange">
      <InfoCircleOutlined class="mr-2" />
      {{ t("TXT_CODE_2eedf5e0") }}
    </a-tag>

    <a-tag v-else color="green">
      <CheckCircleOutlined class="mr-2" />
      {{ t("TXT_CODE_e74d658c") }}
    </a-tag>
  </a-space>
  <div ref="editorEle" :style="{ height: props.height || '80svh' }"></div>
</template>
