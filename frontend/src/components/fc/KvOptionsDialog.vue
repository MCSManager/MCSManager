<script setup lang="ts">
import { t } from "@/lang/i18n";
import type { MountComponent } from "@/types";
import type { AntColumnsType, AntTableCell } from "@/types/ant";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons-vue";
import { type FormInstance } from "ant-design-vue";
import _ from "lodash";
import { computed, h, ref } from "vue";
import { emptyValueValidator, reportValidatorError } from "../../tools/validator";

interface Props extends MountComponent {
  title: string;
  keyTitle?: string;
  valueTitle?: string;
  data: any[];
  subTitle?: string;
  columns?: AntColumnsType[];
  textarea?: boolean;
}

const props = defineProps<Props>();
const dataSource = ref<any[]>(props.data instanceof Array ? _.cloneDeep(props.data) : []);

const open = ref(true);
const formInstance = ref<FormInstance>();

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
  if (props.emitResult) props.emitResult(dataSource.value);
  await cancel();
};

const columns = computed<AntColumnsType[]>(() => {
  if (props.columns) {
    return [
      ...props.columns,
      {
        align: "center",
        key: "operation",
        dataIndex: "operation",
        title: t("TXT_CODE_fe731dfc")
      }
    ];
  }
  return [
    {
      align: "center",
      key: "k",
      dataIndex: "k",
      title: props.keyTitle
    },
    {
      align: "center",
      key: "v",
      dataIndex: "v",
      title: props.valueTitle
    },
    {
      align: "center",
      key: "operation",
      dataIndex: "operation",
      title: t("TXT_CODE_fe731dfc")
    }
  ];
});

const operation = (type: "add" | "del", index = 0) => {
  if (type === "add") {
    const keys = columns.value.filter((v) => v.dataIndex).map((v) => String(v.dataIndex));
    const obj: any = {};
    for (const key of keys) {
      if (key === "operation") continue;
      obj[key] = "";
    }
    dataSource.value.push(obj);
  } else {
    dataSource.value.splice(index, 1);
  }
};
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    width="1300px"
    :mask-closable="false"
    :title="props.title"
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
      <a-form ref="formInstance" :model="dataSource" name="validate_other">
        <a-table
          :data-source="dataSource"
          :columns="columns"
          :pagination="false"
          :scroll="{ x: 542 }"
        >
          <template #bodyCell="{ column, record, index }: AntTableCell">
            <template v-if="column.dataIndex === 'operation'">
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
            <template v-else>
              <a-form-item
                :name="String(column.dataIndex)"
                no-style
                :rules="[
                  {
                    validator: () => emptyValueValidator(record[String(column.dataIndex)]),
                    trigger: 'change'
                  }
                ]"
              >
                <a-textarea
                  v-if="props.textarea"
                  v-model:value="record[String(column.dataIndex)]"
                  :placeholder="(column as any).placeholder"
                  :rows="3"
                  :auto-size="false"
                />
                <a-input
                  v-else
                  v-model:value="record[String(column.dataIndex)]"
                  :placeholder="(column as any).placeholder"
                />
              </a-form-item>
            </template>
          </template>
        </a-table>
      </a-form>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped></style>
