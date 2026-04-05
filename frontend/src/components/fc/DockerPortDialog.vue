<script setup lang="ts">
import { t } from "@/lang/i18n";
import type { MountComponent } from "@/types";
import type { AntColumnsType, AntTableCell } from "@/types/ant";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons-vue";
import { type FormInstance } from "ant-design-vue";
import _ from "lodash";
import { computed, h, onMounted, ref } from "vue";
import { emptyValueValidator, reportValidatorError } from "../../tools/validator";

type Protocol = "tcp" | "udp";
interface DockerPortMapping {
  protocol: Protocol;
  container: string;
  host: string;
}

interface DockerPortMappingWithAutoAssign extends DockerPortMapping {
  autoAssignContainerPort: boolean;
  autoAssignHostPort: boolean;
}

interface Props extends MountComponent {
  data: DockerPortMapping[];
}

const props = defineProps<Props>();
const dataSource = ref<DockerPortMappingWithAutoAssign[]>([]);
const usedPorts = ref<number[]>([]);
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

const emptyPortMapping: DockerPortMappingWithAutoAssign = {
  protocol: "tcp",
  container: "",
  host: "",
  autoAssignContainerPort: false,
  autoAssignHostPort: false
};

const hasMCSMPort = (str: string) => String(str).match(/\{mcsm_port(\d+)\}/);

const cleanupPort = (portValue: string, currentIndex: number) => {
  const portMatch = hasMCSMPort(portValue);
  if (portMatch) {
    const port = parseInt(portMatch[1]);
    const isPortStillUsed = dataSource.value.some(
      (rec, idx) =>
        idx !== currentIndex &&
        ((rec.autoAssignHostPort && hasMCSMPort(rec.host)?.[1] === portMatch[1]) ||
          (rec.autoAssignContainerPort && hasMCSMPort(rec.container)?.[1] === portMatch[1]))
    );
    if (!isPortStillUsed) {
      usedPorts.value = usedPorts.value.filter((p) => p !== port);
    }
  }
};

type OperationType = "add" | "del";
const operation = (type: OperationType, index = 0) => {
  if (type === "add") {
    dataSource.value.push(_.cloneDeep(emptyPortMapping));
  } else {
    // Remove port from usedPorts
    const removedRecord = dataSource.value[index];

    // check and clean host port
    if (removedRecord.autoAssignHostPort) {
      cleanupPort(removedRecord.host, index);
    }

    // check and clean container port
    if (removedRecord.autoAssignContainerPort) {
      cleanupPort(removedRecord.container, index);
    }

    dataSource.value.splice(index, 1);
  }
};

const getNextNumber = (numArr: number[]): number => {
  if (numArr.length === 0) return 1;

  for (let i = 1; i <= numArr.length + 1; i++) {
    if (!numArr.includes(i)) return i;
  }

  return numArr.length + 1;
};

type PortField = "host" | "container";
const handleAutoAssignChange = (record: DockerPortMappingWithAutoAssign, field: PortField) => {
  const otherField = field === "host" ? "container" : "host";
  const autoAssignField = field === "host" ? "autoAssignHostPort" : "autoAssignContainerPort";
  const otherAutoAssignField = field === "host" ? "autoAssignContainerPort" : "autoAssignHostPort";

  if (record[autoAssignField]) {
    const port = hasMCSMPort(record[field]);
    if (port) {
      const portNum = parseInt(port[1]);
      // check if other field is using the same port
      const otherPort = hasMCSMPort(record[otherField]);
      if (!otherPort || parseInt(otherPort[1]) !== portNum || !record[otherAutoAssignField]) {
        // if other field is not using the same port, or other field is not auto assign, then release the port
        usedPorts.value = usedPorts.value.filter((p) => p !== portNum);
      }
    }
    record[autoAssignField] = false;
    record[field] = "";
  } else {
    let portToUse: number;

    const otherPort = hasMCSMPort(record[otherField]);
    if (otherPort && record[otherAutoAssignField]) {
      // Use port from other field
      portToUse = parseInt(otherPort[1]);
    } else {
      portToUse = getNextNumber(usedPorts.value);
      usedPorts.value.push(portToUse);
    }

    record[field] = `{mcsm_port${portToUse}}`;
    record[autoAssignField] = true;
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

  const result: DockerPortMapping[] = dataSource.value.map((item) => ({
    protocol: item.protocol,
    container: item.container,
    host: item.host
  }));

  if (props.emitResult) props.emitResult(result);
  await cancel();
};

onMounted(() => {
  dataSource.value =
    props.data instanceof Array
      ? props.data.map((item) => ({
          ...item,
          autoAssignHostPort: hasMCSMPort(item.host) !== null,
          autoAssignContainerPort: hasMCSMPort(item.container) !== null
        }))
      : [];

  // Initialize used ports
  dataSource.value.forEach((record: DockerPortMappingWithAutoAssign) => {
    (["host", "container"] as const).forEach((key) => {
      const match = hasMCSMPort(record[key]);
      if (match) {
        const portNum = parseInt(match[1]);
        if (!usedPorts.value.includes(portNum)) {
          usedPorts.value.push(portNum);
        }
      }
    });
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
                  :name="`${index}-${String(column.dataIndex)}`"
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
                    :disabled="
                      record[
                        column.dataIndex === 'host'
                          ? 'autoAssignHostPort'
                          : 'autoAssignContainerPort'
                      ]
                    "
                  />
                </a-form-item>
                <a-checkbox
                  class="ml-12"
                  style="width: 114px"
                  :checked="
                    record[
                      column.dataIndex === 'host' ? 'autoAssignHostPort' : 'autoAssignContainerPort'
                    ]
                  "
                  @change="
                    () => handleAutoAssignChange(record, column.dataIndex as 'host' | 'container')
                  "
                >
                  {{ t("TXT_CODE_6f1129fb") }}
                </a-checkbox>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'protocol'">
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
