<script setup lang="ts">
import { t } from "@/lang/i18n";
import type { MountComponent } from "@/types";
import type { AntColumnsType, AntTableCell } from "@/types/ant";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons-vue";
import { type FormInstance } from "ant-design-vue";
import _ from "lodash";
import { computed, h, onMounted, ref } from "vue";
import { emptyValueValidator, reportValidatorError } from "../../tools/validator";

interface DockerDeviceItem {
  PathOnHost: string;
  PathInContainer: string | undefined;
  CgroupPermissions: string | undefined;
}

const emptyDeviceItem: DockerDeviceItem = {
  PathOnHost: "",
  PathInContainer: undefined,
  CgroupPermissions: undefined
};

interface Props extends MountComponent {
  data: DockerDeviceItem[];
  title?: string;
  subTitle?: string;
}

const props = defineProps<Props>();

const dataSource = ref<DockerDeviceItem[]>([]);
const open = ref(true);
const formInstance = ref<FormInstance>();

const columns = computed<AntColumnsType[]>(() => [
  {
    align: "center" as const,
    dataIndex: "PathOnHost",
    title: t("TXT_CODE_e4a82ac7"),
    placeholder: t("TXT_CODE_1d8ece48")
  },
  {
    align: "center" as const,
    dataIndex: "PathInContainer",
    title: t("TXT_CODE_ef6115b7"),
    placeholder: t("TXT_CODE_1d8ece49")
  },
  {
    align: "center" as const,
    dataIndex: "CgroupPermissions",
    title: t("TXT_CODE_511aea70"),
    placeholder: t("TXT_CODE_7595d100")
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
    dataSource.value.push(_.cloneDeep(emptyDeviceItem));
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

  const result: DockerDeviceItem[] = dataSource.value.map((item) => ({
    PathOnHost: item.PathOnHost,
    PathInContainer: item.PathInContainer,
    CgroupPermissions: item.CgroupPermissions
  }));

  if (props.emitResult) props.emitResult(result);
  await cancel();
};

onMounted(() => {
  dataSource.value =
    props.data instanceof Array
      ? props.data.map((item) => ({
          PathOnHost: item.PathOnHost,
          PathInContainer: item.PathInContainer,
          CgroupPermissions: item.CgroupPermissions
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
    :title="props.title || t('TXT_CODE_b3a60c78')"
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

      <a-form ref="formInstance" :model="dataSource" name="validate_devices">
        <a-table
          :data-source="dataSource"
          :columns="columns"
          :pagination="false"
          :scroll="{ x: 542 }"
          size="small"
        >
          <template #bodyCell="{ column, record, index }: AntTableCell">
            <template v-if="column.dataIndex === 'PathOnHost'">
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

            <template v-else-if="column.dataIndex === 'PathInContainer'">
              <a-form-item
                :name="`${index}-${String(column.dataIndex)}`"
                no-style
              >
                <a-input
                  v-model:value="record[String(column.dataIndex)]"
                  class="w-full"
                  size="large"
                  :placeholder="(column as any).placeholder"
                />
              </a-form-item>
            </template>

            <template v-else-if="column.dataIndex === 'CgroupPermissions'">
              <a-form-item
                :name="`${index}-${String(column.dataIndex)}`"
                no-style
              >
                <a-input
                  v-model:value="record[String(column.dataIndex)]"
                  class="w-full"
                  size="large"
                  :placeholder="(column as any).placeholder"
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

.flex-center {
  display: flex;
  align-items: center;
}

.flex-between {
  justify-content: space-between;
}
</style>