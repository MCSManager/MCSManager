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
import { reportValidatorError } from "../../tools/validator";

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
  if (!(item.uploadControl instanceof AbortController)) return;
  item.uploadPercent = 0;
  item.uploadControl.abort();
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

const editImgSrc = async () => {
  open.value = true;
};

const close = () => {
  imgList.value.forEach((item) => cancelUpload(item));
  open.value = false;
};

const save = async () => {
  try {
    await formRef.value?.validate();
    setMetaValue("images", imgList.value);
    displayImgList.value = _.cloneDeep(imgList.value);
    open.value = false;
  } catch (err: any) {
    return reportValidatorError(err);
  }
};
</script>

<template>
  <div style="width: 100%; height: 100%; position: relative">
    <a-carousel v-if="imgList.length !== 0" class="h-100" arrows autoplay :adaptive-height="false">
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
      <div v-for="item in displayImgList" :key="item.url" class="h-100">
        <img :src="item.url" :style="{ height: '100%' }" />
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
    :title="t('TXT_CODE_4a56836d')"
    :closable="false"
    :destroy-on-close="true"
  >
    <a-form ref="formRef" class="mt-20" :model="imgList">
      <a-form-item
        v-for="(imgItem, index) in imgList"
        :key="imgItem.url + imgItem.key"
        v-bind="formItemLayout"
        :label="`${t('TXT_CODE_9900f79e')} ${index + 1}`"
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
          <a-tooltip :title="t('TXT_CODE_7ec87e8a')">
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
      <a-button @click="close">{{ t("TXT_CODE_b1dedda3") }}</a-button>
      <a-button type="primary" @click="save">
        {{ t("TXT_CODE_abfe9512") }}
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

<style lang="scss">
// For antdv carousel
.ant-carousel {
  height: 100% !important;
  div {
    height: 100% !important;
  }
}
</style>
