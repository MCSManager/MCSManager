<script setup lang="ts">
import { t } from "@/lang/i18n";
import type { MountComponent } from "@/types";
import type { AntColumnsType, AntTableCell } from "@/types/ant";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons-vue";
import { type FormInstance } from "ant-design-vue";
import _ from "lodash";
import { computed, h, onMounted, ref } from "vue";
import { emptyValueValidator, reportValidatorError } from "../../tools/validator";

const usedPorts = ref<number[]>([]);
interface Props extends MountComponent {
  data: any[];
}

const props = defineProps<Props>();
const dataSource = ref<any[]>(props.data instanceof Array ? _.cloneDeep(props.data) : []);

const open = ref(true);
const formInstance = ref<FormInstance>();

const columns = computed<AntColumnsType[]>(() => [
  {
    align: "center",
    dataIndex: "host",
    title: t("TXT_CODE_534db0b2"),
    placeholder: "eg: 8080 or {mcsm_port1}"
  },
  {
    align: "center",
    dataIndex: "container",
    title: t("TXT_CODE_b729d2e"),
    placeholder: "eg: 25565 or {mcsm_port1}"
  },
  {
    align: "center",
    dataIndex: "protocol",
    title: t("TXT_CODE_ad1c674c"),
    placeholder: "tcp/udp"
  },
  {
    align: "center",
    key: "operation",
    dataIndex: "operation",
    title: t("TXT_CODE_fe731dfc")
  }
]);

const operation = (type: "add" | "del", index = 0) => {
  if (type === "add") {
    const keys = columns.value.filter((v) => v.dataIndex).map((v) => String(v.dataIndex));
    const obj: any = {};
    for (const key of keys) {
      if (key === "operation") continue;

      obj[key] = "";
      if (key === "protocol") obj[key] = "tcp";
      obj[`${key}Checked`] = false;
    }
    dataSource.value.push(obj);
  } else {
    // Remove port from usedPorts
    const removedRecord = dataSource.value[index];

    ["host", "container"].forEach((field) => {
      if (removedRecord[`${field}Checked`]) {
        const portMatch = hasMCSMPort(removedRecord[field]);
        if (portMatch) {
          const port = parseInt(portMatch[1]);
          // 检查其他记录是否也在使用这个端口
          const isPortStillUsed = dataSource.value.some(
            (rec, idx) =>
              idx !== index &&
              ((rec.hostChecked && hasMCSMPort(rec.host)?.[1] === portMatch[1]) ||
                (rec.containerChecked && hasMCSMPort(rec.container)?.[1] === portMatch[1]))
          );
          if (!isPortStillUsed) {
            usedPorts.value = usedPorts.value.filter((p) => p !== port);
          }
        }
      }
    });

    dataSource.value.splice(index, 1);
  }
};

const getNextNumber = (numArr: number[]): number => {
  const arr = [...new Set(numArr.filter((n) => n >= 1 && n <= 5))];

  if (arr.length === 0) return 1;
  if (arr.length === 1 && arr[0] === 3) return 1;
  if (arr.length === 2 && arr.includes(1) && arr.includes(3)) return 2;
  if (arr.length === 3 && arr.includes(1) && arr.includes(2) && arr.includes(3)) return 4;

  for (let i = 1; i <= 5; i++) {
    if (!numArr.includes(i)) return i;
  }

  return -1;
};

const checkedCount = computed(() => usedPorts.value.length);
const hasMCSMPort = (d: string) => String(d).match(/\{mcsm_port(\d+)\}/);
const handleCheckboxChange = (record: any, dataIndex: string) => {
  const otherDataIndex = dataIndex === "host" ? "container" : "host";

  if (record[`${dataIndex}Checked`]) {
    // 取消勾选 - 只有当另一个字段也没有勾选时才释放端口
    const port = hasMCSMPort(record[dataIndex]);
    if (port) {
      const portNum = parseInt(port[1]);
      // 检查另一个字段是否也在使用同一个端口
      const otherPort = hasMCSMPort(record[otherDataIndex]);
      if (!otherPort || parseInt(otherPort[1]) !== portNum) {
        // 另一个字段没有使用同一个端口，才释放
        usedPorts.value = usedPorts.value.filter((p) => p !== portNum);
      }
    }
    record[`${dataIndex}Checked`] = false;
    record[dataIndex] = "";
  } else {
    // 勾选 - 优先使用另一个字段已分配的端口
    let portToUse: number;

    const otherPort = hasMCSMPort(record[otherDataIndex]);
    if (otherPort && record[`${otherDataIndex}Checked`]) {
      // 使用另一个字段已分配的端口
      portToUse = parseInt(otherPort[1]);
    } else {
      portToUse = getNextNumber(usedPorts.value);
      if (portToUse === -1) {
        record[`${dataIndex}Checked`] = false;
        return;
      }
      usedPorts.value.push(portToUse);
    }

    record[dataIndex] = `{mcsm_port${portToUse}}`;
    record[`${dataIndex}Checked`] = true;
  }
};

const shouldDisableCheckbox = (record: any, dataIndex: string) => {
  const otherDataIndex = dataIndex === "host" ? "container" : "host";
  return (
    checkedCount.value >= 5 && !record[`${dataIndex}Checked`] && !record[`${otherDataIndex}Checked`]
  );
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
  if (props.emitResult) props.emitResult(dataSource.value);
  await cancel();
};

onMounted(() => {
  dataSource.value = props.data instanceof Array ? _.cloneDeep(props.data) : [];
  dataSource.value.forEach((record) => {
    const hostPortMatch = hasMCSMPort(record.host);
    if (hostPortMatch) {
      record.hostChecked = true;
      const portNum = parseInt(hostPortMatch[1]);
      if (!usedPorts.value.includes(portNum)) {
        usedPorts.value.push(portNum);
      }
    }

    const containerPortMatch = hasMCSMPort(record.container);
    if (containerPortMatch) {
      record.containerChecked = true;
      const portNum = parseInt(containerPortMatch[1]);
      if (!usedPorts.value.includes(portNum)) {
        usedPorts.value.push(portNum);
      }
    }
  });
});
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    width="1300px"
    :mask-closable="false"
    :title="t('TXT_CODE_c4435af9')"
    :ok-text="t('TXT_CODE_d507abff')"
    :cancel-text="t('TXT_CODE_a0451c97')"
    @ok="submit"
    @cancel="cancel"
  >
    <div class="dialog-overflow-container">
      <div style="font-size: 14px" class="text-gray-400 mb-4">
        {{
          t("TXT_CODE_56b9e6af", {
            mcsm_port1: "{mcsm_port1}",
            mcsm_port5: "{mcsm_port5}"
          })
        }}
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
          size="small"
        >
          <template #bodyCell="{ column, record, index }: AntTableCell">
            <template v-if="column.dataIndex === 'host' || column.dataIndex === 'container'">
              <div class="flex-center flex-row">
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
                  <a-input-number
                    v-model:value="record[String(column.dataIndex)]"
                    class="w-full"
                    min="1"
                    max="65535"
                    size="large"
                    :placeholder="(column as any).placeholder"
                    :disabled="record[`${column.dataIndex}Checked`]"
                  />
                </a-form-item>
                <a-checkbox
                  class="ml-12"
                  style="width: 114px"
                  :checked="record[`${column.dataIndex}Checked`]"
                  :disabled="shouldDisableCheckbox(record, column.dataIndex as string)"
                  @change="() => handleCheckboxChange(record, column.dataIndex as string)"
                >
                  {{ t("TXT_CODE_6f1129fb") }}
                </a-checkbox>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'protocol'">
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
                <a-select
                  v-model:value="record[String(column.dataIndex)]"
                  :placeholder="(column as any).placeholder"
                  :options="[
                    {
                      label: 'TCP',
                      value: 'tcp'
                    },
                    {
                      label: 'UDP',
                      value: 'udp'
                    }
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
