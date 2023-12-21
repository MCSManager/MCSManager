<script setup lang="ts">
import { ref, computed } from "vue";
import type { MountComponent } from "@/types";
import { t } from "@/lang/i18n";
import type { AntColumnsType, AntTableCell } from "@/types/ant";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons-vue";
import { h } from "vue";
import _ from "lodash";

interface Props extends MountComponent {
  title: string;
  keyTitle: string;
  valueTitle: string;
  data: any[];
  columns?: AntColumnsType[];
}

const props = defineProps<Props>();
const dataSource = ref<any[]>(props.data instanceof Array ? _.cloneDeep(props.data) : []);

const open = ref(true);

const cancel = async () => {
  open.value = false;
  if (props.destroyComponent) props.destroyComponent();
};

const submit = async () => {
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
        title: t("操作")
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
      title: t("操作")
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
    width="600px"
    :mask-closable="false"
    :title="props.title"
    :ok-text="t('确定')"
    :cancel-text="t('TXT_CODE_a0451c97')"
    @ok="submit"
    @cancel="cancel"
  >
    <div class="dialog-overflow-container">
      <div class="flex justify-end mb-20">
        <a-button :icon="h(PlusCircleOutlined)" @click="operation('add')">
          {{ t("新增配置") }}
        </a-button>
      </div>
      <a-table :data-source="dataSource" :columns="columns" :pagination="false">
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
            <a-input
              v-model:value="record[String(column.dataIndex)]"
              :placeholder="t('请输入内容')"
            />
          </template>
        </template>
      </a-table>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped></style>
