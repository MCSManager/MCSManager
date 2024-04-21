<script lang="ts" setup>
import { ref, computed, reactive } from "vue";
import { t } from "@/lang/i18n";
import { useRemoteNode } from "@/hooks/useRemoteNode";
import { message, type FormInstance } from "ant-design-vue";
import { type RemoteNodeDetail } from "@/hooks/useRemoteNode";
import { reportErrorMsg } from "@/tools/validator";

const { addNode, deleteNode, updateNode } = useRemoteNode();

const editMode = ref(false);
const formRef = ref<FormInstance>();

const openDialog = (data?: RemoteNodeDetail, uuid?: string) => {
  if (data && uuid) {
    editMode.value = true;
    dialog.uuid = uuid;
    dialog.data = {
      ...data,
      apiKey: data.apiKey || ""
    };
  } else {
    editMode.value = false;
    dialog.data = {
      ip: "",
      port: 24444,
      prefix: "",
      remarks: "",
      apiKey: ""
    };
  }
  dialog.status = true;
};

const dialog = reactive({
  status: false,
  loading: false,
  title: computed(() => (editMode.value ? t("TXT_CODE_39c5229e") : t("TXT_CODE_15a381d5"))),
  uuid: "",
  data: {
    ip: "",
    port: 24444,
    prefix: "",
    remarks: "",
    apiKey: ""
  },

  check: async () => {
    await formRef.value?.validate();
  },
  close: () => {
    dialog.clear();
    dialog.uuid = "";
    dialog.loading = false;
    dialog.status = false;
  },
  clear: () => {
    dialog.data = {
      ip: "",
      port: 24444,
      prefix: "",
      remarks: "",
      apiKey: ""
    };
  },
  delete: async () => {
    try {
      await deleteNode(dialog.uuid);
      dialog.close();
      message.success(t("TXT_CODE_a00e84d7"));
    } catch (error: any) {
      message.error(error.message ?? error);
    }
  },
  submit: async () => {
    try {
      await dialog.check();
      dialog.loading = true;
      if (editMode.value) {
        await updateNode(dialog.uuid, dialog.data);
      } else {
        await addNode(dialog.data);
      }
      message.success(t("TXT_CODE_e74d658c"));
      dialog.close();
    } catch (error: any) {
      reportErrorMsg(error.message ?? t("TXT_CODE_5245bd11"));
    }
  },
  hidden: () => {
    dialog.status = false;
    dialog.clear();
  }
});

defineExpose({ openDialog });
</script>

<template>
  <a-modal v-model:open="dialog.status" :title="dialog.title">
    <a-form ref="formRef" :model="dialog.data" layout="vertical">
      <a-form-item :label="t('TXT_CODE_a884de59')" name="remarks" required>
        <a-input v-model:value="dialog.data.remarks" :placeholder="t('TXT_CODE_4b1d5199')" />
      </a-form-item>

      <a-form-item :label="t('TXT_CODE_93f9b02a')" name="ip" required>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_be7a689a") }}
            <br />
            {{ t("TXT_CODE_c82a51b0") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="dialog.data.ip" />
      </a-form-item>

      <a-form-item :label="t('TXT_CODE_4a6bf8c6')" name="port" required>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_df455795") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="dialog.data.port" />
      </a-form-item>

      <a-form-item :label="t('TXT_CODE_300c2ff4')" name="apiKey" :required="!editMode">
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_5ef2cf20") }}

            <a href="https://docs.mcsmanager.com/advanced/distributed.html" target="_blank">
              {{ t("TXT_CODE_be1351ce") }}
            </a>
          </a-typography-text>
        </a-typography-paragraph>
        <a-input
          v-model:value="dialog.data.apiKey"
          :placeholder="editMode ? t('TXT_CODE_dc570cf2') : t('TXT_CODE_fe25087f')"
        />
      </a-form-item>

      <a-form-item :label="t('TXT_CODE_693f31d6')" name="prefix">
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_3e93e31e") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="dialog.data.prefix" />
      </a-form-item>
    </a-form>
    <template #footer>
      <div class="justify-space-between">
        <a-popconfirm
          :title="t('TXT_CODE_fb267b0b')"
          ok-text="Yes"
          cancel-text="No"
          @confirm="dialog.delete()"
        >
          <a-button v-if="editMode" key="delete" danger>{{ t("TXT_CODE_8b937b23") }}</a-button>
        </a-popconfirm>
        <div class="right">
          <a-button key="back" @click="dialog.hidden()">{{ t("TXT_CODE_a0451c97") }}</a-button>
          <a-button key="submit" type="primary" :loading="dialog.loading" @click="dialog.submit()">
            {{ t("TXT_CODE_d507abff") }}
          </a-button>
        </div>
      </div>
    </template>
  </a-modal>
</template>
