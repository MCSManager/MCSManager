<script setup lang="ts">
import { t } from "@/lang/i18n";
import type { MountComponent } from "@/types";
import type { AntColumnsType, AntTableCell } from "@/types/ant";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons-vue";
import { type FormInstance } from "ant-design-vue";
import _ from "lodash";
import { computed, h, onMounted, ref } from "vue";
import { emptyValueValidator, reportValidatorError } from "../../tools/validator";

type CapabilityOperation = "add" | "drop";
interface DockerCapabilitiesItem {
  label: string;
  value: CapabilityOperation;
}

const emptyCapabilitiesItem: DockerCapabilitiesItem = {
  label: "",
  value: "add"
};

interface Props extends MountComponent {
  data: DockerCapabilitiesItem[];
  title?: string;
  subTitle?: string;
}

const props = defineProps<Props>();
const dataSource = ref<DockerCapabilitiesItem[]>([]);
const open = ref(true);
const formInstance = ref<FormInstance>();

const columns = computed<AntColumnsType[]>(() => [
  {
    align: "center" as const,
    dataIndex: "label",
    title: t("TXT_CODE_d51db65a"),
    placeholder: t("TXT_CODE_9227a967")
  },
  {
    align: "center" as const,
    dataIndex: "value",
    title: t("TXT_CODE_adea33ce")
  },
  {
    align: "center" as const,
    key: "operation",
    dataIndex: "operation",
    title: t("TXT_CODE_fe731dfc")
  }
]);

type OperationType = "add" | "del";
const operation = (type: OperationType, index = 0) => {
  if (type === "add") {
    dataSource.value.push(_.cloneDeep(emptyCapabilitiesItem));
  } else {
    dataSource.value.splice(index, 1);
  }
};

const cancel = async () => {
  open.value = false;
  if (props.destroyComponent) props.destroyComponent();
};

const submit = async () => {
  try {
    await formInstance.value?.validate();
  } catch (error: any) {
    return reportValidatorError(error);
  }

  const result: DockerCapabilitiesItem[] = dataSource.value.map((item) => ({
    label: item.label,
    value: item.value
  }));

  if (props.emitResult) props.emitResult(result);
  await cancel();
};

onMounted(() => {
  dataSource.value =
    props.data instanceof Array
      ? props.data.map((item) => ({
          label: item.label,
          value: item.value
        }))
      : [];
});
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    width="1300px"
    :mask-closable="false"
    :title="t('TXT_CODE_bbbd4133')"
    :ok-text="t('TXT_CODE_d507abff')"
    :cancel-text="t('TXT_CODE_a0451c97')"
    @ok="submit"
    @cancel="cancel"
  >
    <div class="dialog-overflow-container">
      <div v-if="props.subTitle" style="font-size: 14px" class="text-gray-400 mb-4">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-html="props.subTitle"></span>
      </div>
      <div class="flex justify-end mb-20">
        <a-button :icon="h(PlusCircleOutlined)" @click="operation('add')">
          {{ t("TXT_CODE_dfc17a0c") }}
        </a-button>
      </div>
      <a-form ref="formInstance" :model="dataSource" name="validate_capabilities">
        <a-table
          :data-source="dataSource"
          :columns="columns"
          :pagination="false"
          :scroll="{ x: 542 }"
          size="small"
        >
          <template #bodyCell="{ column, record, index }: AntTableCell">
            <template v-if="column.dataIndex === 'label'">
              <a-form-item
                :name="`${index}-${String(column.dataIndex)}`"
                no-style
                :rules="[
                  {
                    validator: () => emptyValueValidator(record[String(column.dataIndex)]),
                    trigger: 'change'
                  }
                ]"
              >
                <a-input
                  v-model:value="record[String(column.dataIndex)]"
                  class="w-full"
                  size="large"
                  :placeholder="(column as any).placeholder"
                />
              </a-form-item>
            </template>

            <template v-else-if="column.dataIndex === 'value'">
              <a-form-item
                :name="`${index}-${String(column.dataIndex)}`"
                no-style
                :rules="[
                  {
                    validator: () => emptyValueValidator(record[String(column.dataIndex)]),
                    trigger: 'change'
                  }
                ]"
              >
                <a-select
                  v-model:value="record[String(column.dataIndex)]"
                  class="w-full"
                  size="large"
                  :placeholder="(column as any).placeholder"
                  :options="[
                    { label: t('TXT_CODE_a1d885c1'), value: 'add' },
                    { label: t('TXT_CODE_fac5dc49'), value: 'drop' }
                  ]"
                />
              </a-form-item>
            </template>

            <template v-else-if="column.dataIndex === 'operation'">
              <div class="flex-center flex-between">
                <div>
                  <a-button
                    :icon="h(MinusCircleOutlined)"
                    danger
                    @click="operation('del', index)"
                  ></a-button>
                </div>
              </div>
            </template>
          </template>
        </a-table>
      </a-form>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped>
.dialog-overflow-container {
  max-height: 600px;
  overflow-y: auto;
}
</style>