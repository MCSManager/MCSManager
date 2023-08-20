<script setup lang="ts">
import type { LayoutCard } from "@/types/index";
import { ref, computed, reactive, onMounted } from "vue";
import type { MapData } from "@/types/index";
import type { FormInstance } from "ant-design-vue";
import { BulbOutlined } from "@ant-design/icons-vue";
import { $t as t } from "@/lang/i18n";

const open = ref(false);
const card = ref<LayoutCard>();
let resolveFn: (value: unknown) => void;

const formData = ref<MapData<string>>({});
const formRef = ref<FormInstance>();

const onClose = () => {
  open.value = false;
  resolveFn(false);
};
const openDialog = (cardInfo: LayoutCard) => {
  formData.value = {};
  open.value = true;
  if (!cardInfo.meta) cardInfo.meta = {};
  card.value = cardInfo;
  return new Promise((resolve) => {
    resolveFn = resolve;
  });
};

const onSubmit = async () => {
  const result = await formRef.value?.validate();
  if (card.value && result) card.value.meta = result;

  open.value = false;
  resolveFn(true);
};

defineExpose({
  openDialog,
});
</script>

<template>
  <a-drawer
    class="global-text-color"
    :title="t('TXT_CODE_e4c84088')"
    placement="bottom"
    :open="open"
    @close="onClose"
  >
    <template #extra>
      <a-button style="margin-right: 8px" @click="onClose">
        {{ t("TXT_CODE_a0451c97") }}
      </a-button>
      <a-button type="primary" @click="onSubmit">
        {{ t("TXT_CODE_d507abff") }}
      </a-button>
    </template>
    <div v-if="card && card.meta" class="app-max-width">
      <a-form
        ref="formRef"
        :model="formData"
        layout="vertical"
        autocomplete="off"
      >
        <a-row :gutter="[20, 20]">
          <a-col :span="24" :md="12" v-for="item in card.params">
            <a-form-item :label="item.label" :name="item.field">
              <a-input
                v-if="item.type === 'string'"
                v-model:value="formData[item.field]"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
      <p>
        <BulbOutlined />
        <span>
          {{ t("TXT_CODE_e29b79df") }}
        </span>
      </p>
      <p>
        {{ t("TXT_CODE_13663120") }}
      </p>
    </div>
  </a-drawer>
</template>
