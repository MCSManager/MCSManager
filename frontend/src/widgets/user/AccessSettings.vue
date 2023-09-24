<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard, UserInstance } from "@/types";
import { computed, ref } from "vue";
import type { Ref } from "vue";
import { t } from "@/lang/i18n";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useScreen } from "@/hooks/useScreen";
import { arrayFilter } from "@/tools/array";
import { userInfoApiAdvanced } from "@/services/apis";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import ErrorCard from "@/components/ErrorCard.vue";
import { updateUserInstance } from "@/services/apis";

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
      deletedInstance.serviceUuid == instance.serviceUuid &&
      deletedInstance.instanceUuid == instance.instanceUuid
    ) {
      dataSource.value.splice(valueKey, 1);
      await updateUserInstance().execute({
        data: {
          config: {
            instances: dataSource.value
          },
          uuid: <string>userUuid
        }
      });
      break;
    }
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
  return arrayFilter([
    {
      align: "center",
      title: t("所属节点"),
      dataIndex: "serviceUuid",
      key: "daemon",
      minWidth: "200px"
    },
    {
      align: "center",
      title: t("实例名称"),
      dataIndex: "nickname",
      key: "name",
      minWidth: "200px"
    },
    {
      align: "center",
      title: t("到期时间"),
      dataIndex: "lastDatetime",
      key: "limitTime",
      minWidth: "200px",
      condition: () => !screen.isPhone.value
    },
    {
      align: "center",
      title: t("实例状态"),
      dataIndex: "status",
      key: "status",
      minWidth: "200px",
      condition: () => !screen.isPhone.value
    },
    {
      align: "center",
      title: t("操作"),
      key: "operation",
      minWidth: "200px",
      scopedSlots: { customRender: "operation" }
    }
  ]);
});
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <div v-if="userUuid" class="h-100 w-100">
        <a-col :span="24">
          <BetweenMenus>
            <template #left>
              <a-typography-title class="mb-0" :level="4">
                {{ t("TXT_CODE_e1c9a6ac") }}
              </a-typography-title>
            </template>
            <template #right>
              <a-button type="primary">{{ t("TXT_CODE_a60466a1") }}</a-button>
            </template>
          </BetweenMenus>
        </a-col>

        <a-col :span="24">
          <CardPanel class="h-100">
            <template #body>
              <a-table :data-source="dataSource" :columns="columns">
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'operation'">
                    <a-button danger @click="handleDelete(record)">
                      {{ t("TXT_CODE_ecbd7449") }}
                    </a-button>
                  </template>
                </template>
              </a-table>
            </template>
          </CardPanel>
        </a-col>
      </div>
      <div v-else class="h-100 w-100">
        <ErrorCard
          :title="t('缺少参数，组件无法运作')"
          :details="t('请添加 get 参数 uuid')"
          style="min-height: 600px"
        />
      </div>
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
