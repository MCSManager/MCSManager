<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types";
import type { UserInstance } from "@/types/user";
import { computed, ref } from "vue";
import type { Ref } from "vue";
import { t } from "@/lang/i18n";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useScreen } from "@/hooks/useScreen";
import { arrayFilter } from "@/tools/array";
import { userInfoApiAdvanced } from "@/services/apis";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { updateUserInstance } from "@/services/apis";
import { useSelectInstances } from "@/components/fc";
import { message } from "ant-design-vue";
import { INSTANCE_STATUS } from "@/types/const";
import type { AntColumnsType, AntTableCell } from "@/types/ant";

const props = defineProps<{
  card: LayoutCard;
  uuid: string;
}>();

const screen = useScreen();

let dataSource: Ref<UserInstance[]> = ref([]);
const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
let userUuid: string | undefined = getMetaOrRouteValue("uuid");

const handleDelete = async (deletedInstance: UserInstance) => {
  for (let valueKey = 0; valueKey < dataSource.value.length; valueKey++) {
    const instance = dataSource.value[valueKey];
    if (
      deletedInstance.daemonId == instance.daemonId &&
      deletedInstance.instanceUuid == instance.instanceUuid
    ) {
      dataSource.value.splice(valueKey, 1);
      break;
    }
  }
};

const assignApp = async () => {
  try {
    const selectedInstances = await useSelectInstances();
    if (selectedInstances) dataSource.value = dataSource.value.concat(selectedInstances);
  } catch (err: any) {
    console.error(err);
  }
};

const saveData = async () => {
  try {
    await updateUserInstance().execute({
      data: {
        config: {
          instances: dataSource.value
        },
        uuid: <string>userUuid
      }
    });
    return message.success(t("TXT_CODE_d3de39b4"));
  } catch (err: any) {
    console.error(err);
    return message.error(err.message);
  }
};

async function refreshChart() {
  if (userUuid == null) {
    return;
  }
  const rawUserInfo = (
    await userInfoApiAdvanced().execute({
      params: {
        uuid: <string>userUuid,
        advanced: true
      }
    })
  ).value;
  if (!rawUserInfo) {
    return;
  }
  const newDataSource: UserInstance[] = [];
  for (const instance of rawUserInfo.instances) {
    newDataSource.push(instance);
  }
  dataSource.value = newDataSource;
}

refreshChart();

const columns = computed(() => {
  return arrayFilter<AntColumnsType>([
    {
      align: "center",
      title: t("TXT_CODE_b26a0528"),
      dataIndex: "daemonId",
      key: "daemon",
      minWidth: 200,
      condition: () => !screen.isPhone.value
    },
    {
      align: "center",
      title: t("TXT_CODE_f70badb9"),
      dataIndex: "nickname",
      key: "name",
      minWidth: 200
    },
    {
      align: "center",
      title: t("TXT_CODE_fa920c0"),
      dataIndex: "lastDatetime",
      key: "limitTime",
      minWidth: 200,
      condition: () => !screen.isPhone.value
    },
    {
      align: "center",
      title: t("TXT_CODE_3d602459"),
      dataIndex: "status",
      key: "status",
      minWidth: 200,
      customRender: (e: { text: "-1" | "1" | "2" | "3" }) => {
        return INSTANCE_STATUS[e.text] || e.text;
      },
      condition: () => !screen.isPhone.value
    },
    {
      align: "center",
      title: t("TXT_CODE_fe731dfc"),
      key: "operation",
      minWidth: 200,
      scopedSlots: { customRender: "operation" }
    }
  ]);
});
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row v-if="userUuid" :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template #left>
            <a-typography-title class="mb-0" :level="4">
              {{ t("TXT_CODE_e1c9a6ac") }}
            </a-typography-title>
          </template>
          <template #right>
            <a-button v-show="!screen.isPhone.value" class="mr-8" @click="refreshChart()">
              {{ t("TXT_CODE_b76d94e0") }}
            </a-button>
            <a-button class="mr-8" type="primary" ghost @click="saveData()">
              {{ t("TXT_CODE_830ba3d8") }}
            </a-button>
            <a-button type="primary" @click="assignApp">
              {{ t("TXT_CODE_a60466a1") }}
            </a-button>
          </template>
        </BetweenMenus>
      </a-col>

      <a-col :span="24">
        <CardPanel class="h-100">
          <template #body>
            <a-table :scroll="{ x: 'max-content' }" :data-source="dataSource" :columns="columns">
              <template #bodyCell="{ column, record }: AntTableCell">
                <template v-if="column.key === 'operation'">
                  <a-button danger size="large" @click="handleDelete(record)">
                    {{ t("TXT_CODE_ecbd7449") }}
                  </a-button>
                </template>
              </template>
            </a-table>
          </template>
        </CardPanel>
      </a-col>
    </a-row>
  </div>
</template>

<style lang="scss" scoped>
.search-input {
  transition: all 0.4s;
  text-align: center;
  width: 50%;
}

@media (max-width: 992px) {
  .search-input {
    transition: all 0.4s;
    text-align: center;
    width: 100% !important;
  }
}

.search-input:hover {
  width: 100%;
}
</style>
