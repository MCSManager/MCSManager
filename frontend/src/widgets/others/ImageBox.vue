<script setup lang="ts">
import { ref } from "vue";
import { t } from "@/lang/i18n";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { Empty, message, type UploadProps } from "ant-design-vue";
import { UploadOutlined } from "@ant-design/icons-vue";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { uploadFile } from "@/services/apis/layout";
import { useAppStateStore } from "@/stores/useAppStateStore";

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaValue, setMetaValue } = useLayoutCardTools(props.card);
const { containerState } = useLayoutContainerStore();
const { isAdmin } = useAppStateStore();
const imgSrc = ref(getMetaValue("image", ""));
const open = ref(false);
const activeKey = ref("upload");
const percentComplete = ref(0);

const { state, execute } = uploadFile();
const beforeUpload: UploadProps["beforeUpload"] = async (file) => {
  const uploadFormData = new FormData();
  uploadFormData.append("file", file);
  await execute({
    data: uploadFormData,
    timeout: 60 * 60 * 1000,
    onUploadProgress: (progressEvent: any) => {
      percentComplete.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    }
  });
  if (state.value) {
    imgSrc.value = `${window.location.origin}/upload_files/${state.value}`;
    setMetaValue("image", imgSrc.value);
    percentComplete.value = 0;
    message.success(t("TXT_CODE_773f36a0"));
    open.value = false;
    return false;
  }
};

const save = async () => {
  setMetaValue("image", imgSrc.value);
  open.value = false;
};

const editImgSrc = async () => {
  open.value = true;
};
</script>

<template>
  <div style="width: 100%; height: 100%; position: relative">
    <div v-if="imgSrc !== '' && containerState.isDesignMode" class="mask">
      <a-button type="primary" @click="editImgSrc()">
        {{ t("TXT_CODE_fd13f431") }}
      </a-button>
    </div>
    <img v-if="imgSrc !== ''" class="global-card-container-shadow" :src="imgSrc" />
    <CardPanel v-else style="height: 100%">
      <template #body>
        <a-empty :image="Empty.PRESENTED_IMAGE_SIMPLE">
          <template #description>
            <span>{{ t("TXT_CODE_635d051") }}</span>
          </template>
          <a-button
            :disabled="!containerState.isDesignMode || !isAdmin"
            type="primary"
            @click="editImgSrc()"
          >
            {{ t("TXT_CODE_589e091c") }}
          </a-button>
        </a-empty>
      </template>
    </CardPanel>
  </div>
  <a-modal v-model:open="open" :title="null" :closable="false" :destroy-on-close="true">
    <a-tabs v-model:activeKey="activeKey">
      <a-tab-pane key="upload" :tab="t('TXT_CODE_e00c858c')">
        <a-progress
          v-if="percentComplete > 0"
          :stroke-color="{
            '0%': '#49b3ff',
            '100%': '#25f5b9'
          }"
          :percent="percentComplete"
          class="mb-20"
        />

        <a-upload
          :max-count="1"
          :disabled="percentComplete > 0"
          :show-upload-list="false"
          :before-upload="beforeUpload"
        >
          <a-button type="primary" :loading="percentComplete > 0">
            <upload-outlined v-if="percentComplete === 0" />
            {{
              percentComplete > 0
                ? t("TXT_CODE_b625dbf0") + percentComplete + "%"
                : t("TXT_CODE_e00c858c")
            }}
          </a-button>
        </a-upload>
        <a-typography class="mt-20">
          <a-typography-title :level="5">{{ t("温馨提示") }}</a-typography-title>
          <a-typography-paragraph>
            <ol>
              <li>{{ t("上传后将自动保存") }}</li>
              <li>{{ t("你可以通过 “重置布局” 来清空你上传的所有文件") }}</li>
            </ol>
          </a-typography-paragraph>
        </a-typography>
      </a-tab-pane>
      <a-tab-pane key="url" :tab="t('网络URL')" force-render>
        <a-input v-model:value.lazy.trim="imgSrc" autofocus :placeholder="t('TXT_CODE_c8a51b2e')" />
      </a-tab-pane>
    </a-tabs>
    <template #footer>
      <a-button @click="open = false">{{ t("关闭") }}</a-button>
      <a-button v-if="activeKey === 'url'" type="primary" @click="save">
        {{ t("保存") }}
      </a-button>
    </template>
  </a-modal>
</template>

<style scoped lang="scss">
img {
  border: 0;
  border-radius: 6px;
  width: 100%;
  box-shadow: 0 1px 2px 1px var(--card-shadow-color);
  height: 100%;
  object-fit: cover;
  aspect-ratio: 16/9;
}
.app-dark-theme {
  img {
    filter: brightness(0.7);
  }
}
.mask {
  position: absolute;
  z-index: 1;
  background-color: rgba(0, 0, 0, 0.5);
  width: 100%;
  height: 100%;

  button {
    margin: auto;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    position: absolute;
    width: fit-content;
  }
}
</style>
