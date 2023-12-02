<script setup lang="ts">
import { ref } from "vue";
import { t } from "@/lang/i18n";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { Empty, message, type FormInstance } from "ant-design-vue";
import {
  UploadOutlined,
  LeftCircleOutlined,
  RightCircleOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  CloseOutlined
} from "@ant-design/icons-vue";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { uploadFile } from "@/services/apis/layout";
import { useAppStateStore } from "@/stores/useAppStateStore";
import type { FileType } from "ant-design-vue/es/upload/interface";
import _ from "lodash";

const props = defineProps<{
  card: LayoutCard;
}>();

interface ImgList {
  url: string;
  key: number;
  uploadPercent: number;
  uploadControl?: AbortController;
}

const { getMetaValue, setMetaValue } = useLayoutCardTools(props.card);
const { containerState } = useLayoutContainerStore();
const { isAdmin } = useAppStateStore();
const open = ref(false);
const imgList = ref(getMetaValue<ImgList[]>("images", []));
const displayImgList = ref(_.cloneDeep(imgList.value));

const beforeUpload = async (file: FileType, imgItem: ImgList) => {
  imgItem.uploadControl = new AbortController();
  const { state, execute } = uploadFile();
  const uploadFormData = new FormData();
  uploadFormData.append("file", file);
  await execute({
    data: uploadFormData,
    params: {
      t: Date.now()
    },
    timeout: Number.MAX_VALUE,
    signal: imgItem.uploadControl.signal,
    onUploadProgress: (progressEvent: any) => {
      imgItem.uploadPercent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    },
    forceRequest: true
  });
  if (state.value) {
    imgItem.url = `/upload_files/${state.value}`;
    imgItem.uploadPercent = 0;
    message.success(t("TXT_CODE_773f36a0"));
    return false;
  }
};

const cancelUpload = (item: ImgList) => {
  item.uploadPercent = 0;
  item.uploadControl?.abort();
};

const save = async () => {
  try {
    await formRef.value?.validate();
    setMetaValue("images", imgList.value);
    open.value = false;
  } catch (err: any) {
    return message.error(err.message);
  }
};

const editImgSrc = async () => {
  open.value = true;
};

const close = () => {
  imgList.value.forEach((item) => cancelUpload(item));
  open.value = false;
};

const formRef = ref<FormInstance>();
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 4 }
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 20 }
  }
};
const formItemLayoutWithOutLabel = {
  wrapperCol: {
    xs: { span: 24, offset: 0 },
    sm: { span: 20, offset: 4 }
  }
};

const removeImgSrc = (item: ImgList) => {
  const index = imgList.value.indexOf(item);
  if (index !== -1) {
    imgList.value.splice(index, 1);
  }
};
const addImgSrc = () => {
  imgList.value.push({
    url: "",
    key: Date.now(),
    uploadPercent: 0
  });
};
</script>

<template>
  <div style="width: 100%; height: 100%; position: relative">
    <a-carousel v-if="imgList.length !== 0" arrows autoplay>
      <template #prevArrow>
        <div class="custom-slick-arrow" style="left: 10px; z-index: 1">
          <left-circle-outlined />
        </div>
      </template>
      <template #nextArrow>
        <div class="custom-slick-arrow" style="right: 10px">
          <right-circle-outlined />
        </div>
      </template>
      <div v-for="item in displayImgList" :key="item.url">
        <img :src="item.url" />
      </div>
    </a-carousel>
    <div v-if="imgList.length !== 0 && containerState.isDesignMode" class="mask">
      <a-button type="primary" @click="editImgSrc()">
        {{ t("TXT_CODE_fd13f431") }}
      </a-button>
    </div>
    <CardPanel v-if="imgList.length === 0" style="height: 100%">
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
  <a-modal
    v-model:open="open"
    :title="t('设置图片列表')"
    :closable="false"
    :destroy-on-close="true"
  >
    <a-form ref="formRef" class="mt-20" :model="imgList">
      <a-form-item
        v-for="(imgItem, index) in imgList"
        :key="imgItem.url + imgItem.key"
        v-bind="formItemLayout"
        :label="`${t('图片')} ${index + 1}`"
        :name="[index, 'url']"
        :rules="{
          required: true,
          message: t('TXT_CODE_c8a51b2e'),
          trigger: 'change'
        }"
      >
        <div v-if="imgItem.uploadPercent === 0" style="display: inline-flex; width: 80%">
          <a-input
            v-model:value.trim="imgItem.url"
            autofocus
            :placeholder="t('TXT_CODE_c8a51b2e')"
          />
          <a-upload
            :max-count="1"
            :disabled="imgItem.uploadPercent > 0"
            :show-upload-list="false"
            :before-upload="(file: FileType) => beforeUpload(file, imgItem)"
            class="mr-8"
          >
            <a-button type="link" :loading="imgItem.uploadPercent > 0">
              <upload-outlined />
            </a-button>
          </a-upload>
        </div>

        <div v-else style="display: inline-flex; width: 80%">
          <a-input :value="`${t('TXT_CODE_b625dbf0') + imgItem.uploadPercent}%`" disabled />
          <a-tooltip :title="t('取消上传')">
            <a-button type="link" @click="cancelUpload(imgItem)">
              <CloseOutlined />
            </a-button>
          </a-tooltip>
        </div>

        <a-button v-if="imgList.length > 1" type="link" @click="removeImgSrc(imgItem)">
          <MinusCircleOutlined />
        </a-button>
      </a-form-item>
      <a-form-item v-bind="formItemLayoutWithOutLabel">
        <a-button type="dashed" @click="addImgSrc">
          <PlusOutlined />
          {{ t("TXT_CODE_589e091c") }}
        </a-button>
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button @click="close">{{ t("关闭") }}</a-button>
      <a-button type="primary" @click="save">
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
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.5);
  width: 100%;
  height: 100%;
  top: 0;

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

:deep(.slick-slider) {
  border-radius: 6px;
  background: #364d79;
  overflow: hidden;
  box-shadow: 0 1px 2px 1px var(--card-shadow-color);
  transition: box-shadow 0.4s ease-in-out;

  &:hover {
    box-shadow:
      0 4px 8px 0 var(--card-shadow-color),
      0 1px 2px 1px var(--card-shadow-color);
  }
}

:deep(.slick-arrow.custom-slick-arrow) {
  width: 25px;
  height: 25px;
  font-size: 25px;
  color: #fff;
  background-color: rgba(31, 45, 61, 0.11);
  transition: ease all 0.3s;
  opacity: 0.3;
  z-index: 1;
}
:deep(.slick-arrow.custom-slick-arrow:before) {
  display: none;
}
:deep(.slick-arrow.custom-slick-arrow:hover) {
  color: #fff;
  opacity: 0.5;
}

:deep(.slick-slide h3) {
  color: #fff;
}
</style>
