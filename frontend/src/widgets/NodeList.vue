<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { ref, computed } from "vue";
import { t } from "@/lang/i18n";
import {
  ProfileOutlined,
  SearchOutlined,
  SettingOutlined,
  CodeOutlined,
  ClusterOutlined,
  BlockOutlined,
  FolderOpenOutlined
} from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useOverviewInfo, type ComputedNodeInfo } from "@/hooks/useOverviewInfo";
import IconBtn from "@/components/IconBtn.vue";
import NodeSimpleChart from "@/components/NodeSimpleChart.vue";
import {
  editNode as editNodeApi,
  addNode as addNodeApi,
  deleteNode as deleteNodeApi
} from "@/services/apis";
import { message } from "ant-design-vue";

defineProps<{
  card: LayoutCard;
}>();

const operationForm = ref({
  name: ""
});

const { state } = useOverviewInfo();

const detailList = (node: ComputedNodeInfo) => {
  return [
    {
      title: t("TXT_CODE_f52079a0"),
      value: `${node.ip}:${node.port}`
    },
    {
      title: t("TXT_CODE_593ee330"),
      value: node.memText
    },
    {
      title: t("TXT_CODE_2c2712a4"),
      value: node.cpuInfo
    },
    {
      title: t("TXT_CODE_3d602459"),
      value: node.instanceStatus
    },
    {
      title: t("TXT_CODE_c9609785"),
      value: node.available ? t("TXT_CODE_823bfe63") : t("TXT_CODE_66ce073e")
    },
    {
      title: t("TXT_CODE_3d0885c0"),
      value: node.platformText
    },
    {
      title: t("TXT_CODE_81634069"),
      value: node.version
    }
  ];
};

const nodeOperations = [
  {
    title: t("TXT_CODE_ae533703"),
    icon: FolderOpenOutlined,
    click: () => {
      console.log(3);
    }
  },
  {
    title: t("TXT_CODE_524e3036"),
    icon: CodeOutlined,
    click: () => {
      console.log(3);
    }
  },
  {
    title: t("TXT_CODE_e6c30866"),
    icon: BlockOutlined,
    click: () => {
      console.log(3);
    }
  },
  {
    title: t("TXT_CODE_b5c7b82d"),
    icon: SettingOutlined,
    click: (node: ComputedNodeInfo) => {
      editDialog.value.uuid = node.uuid;
      editDialog.value.data.ip = node.ip;
      editDialog.value.data.port = node.port;
      editDialog.value.data.remarks = node.remarks;
      editDialog.value.showEdit();
    }
  }
];

const addNode = async () => {
  const { execute } = addNodeApi();
  try {
    await execute({
      data: {
        ...editDialog.value.data
      }
    });
    editDialog.value.hidden();
    message.success(t("添加节点成功"));
    editDialog.value.clear();
  } catch (error: any) {
    message.error(t("添加节点失败"));
  }
  editDialog.value.loading = false;
};

const deleteNode = async () => {
  const { execute } = deleteNodeApi();
  try {
    await execute({
      params: {
        uuid: editDialog.value.uuid
      }
    });
    message.success(t("删除节点成功"));
    editDialog.value.hidden();
  } catch (error) {
    message.error(t("删除节点失败"));
  }
  editDialog.value.loading = false;
};

const editNode = async () => {
  const { apiKey, ...outherData } = editDialog.value.data;

  const updatedData = apiKey == "" ? { ...outherData } : editDialog.value.data;
  const { execute } = editNodeApi();
  try {
    await execute({
      params: {
        uuid: editDialog.value.uuid
      },
      data: {
        ...updatedData
      }
    });
    message.success(t("保存成功"));
    editDialog.value.loading = false;
    editDialog.value.hidden();
  } catch (error) {
    message.error(t("编辑节点失败"));
  }
};

const editMode = ref(false);
const editDialog = ref({
  status: false,
  loading: false,
  title: computed(() => (editMode.value ? t("编辑节点信息") : t("新增节点"))),
  data: {
    ip: "",
    port: 24444,
    remarks: "",
    apiKey: ""
  },
  uuid: "",
  check: () => {
    if (!editMode.value) {
      if (!editDialog.value.data.apiKey) return false;
    }
    if (!editDialog.value.data.ip || !editDialog.value.data.port) return false;
  },
  show: () => {
    editMode.value = false;
    editDialog.value.status = true;
  },
  showEdit: () => {
    editMode.value = true;
    editDialog.value.status = true;
  },
  clear: () => {
    editDialog.value.data = {
      ip: "",
      port: 24444,
      remarks: "",
      apiKey: ""
    };
  },
  delete: () => {
    editDialog.value.loading = true;
    deleteNode();
  },
  submit: () => {
    if (editDialog.value.check() === false) {
      return message.error(t("请正确填写表单"));
    }
    editDialog.value.loading = true;
    if (editMode.value) {
      editNode();
    } else {
      addNode();
    }
  },
  hidden: () => {
    editDialog.value.status = false;
    editDialog.value.clear();
  }
});
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template #left>
            <a-typography-title class="mb-0" :level="4">
              <ClusterOutlined />
              {{ card.title }}
            </a-typography-title>
          </template>
          <template #right>
            <a-button class="mr-12" type="primary" @click="editDialog.show">
              {{ t("TXT_CODE_15a381d5") }}
            </a-button>
            <a-button href="https://docs.mcsmanager.com/" target="_black">
              {{ t("TXT_CODE_3a302f23") }}
            </a-button>
          </template>
          <template #center>
            <div class="search-input">
              <a-input v-model:value="operationForm.name" :placeholder="t('TXT_CODE_461d1a01')">
                <template #prefix>
                  <search-outlined />
                </template>
              </a-input>
            </div>
          </template>
        </BetweenMenus>
      </a-col>

      <a-col :span="24">
        <a-typography-text type="secondary">
          {{ t("TXT_CODE_f9a92e38") }}
          <br />
          {{ t("TXT_CODE_a65c65c2") }}
        </a-typography-text>
      </a-col>

      <a-col v-for="item in state?.remote" :key="item.uuid" :span="24" :lg="12">
        <CardPanel style="height: 100%">
          <template #title>
            <ProfileOutlined />
            {{ item.remarks || item.ip }}
          </template>
          <template #operator>
            <span
              v-for="operation in nodeOperations"
              :key="operation.title"
              size="default"
              class="mr-2"
            >
              <IconBtn
                :icon="operation.icon"
                :title="operation.title"
                @click="operation.click(item)"
              ></IconBtn>
            </span>
          </template>
          <template #body>
            <a-row :gutter="[24, 24]" class="mt-2">
              <a-col
                v-for="detail in detailList(item)"
                :key="detail.title + detail.value"
                :span="6"
              >
                <a-typography-paragraph>
                  <div>
                    {{ detail.title }}
                  </div>
                  <div>
                    {{ detail.value }}
                  </div>
                </a-typography-paragraph>
              </a-col>
            </a-row>
            <NodeSimpleChart
              class="mt-24"
              :cpu-data="item.cpuChartData ?? []"
              :mem-data="item.memChartData ?? []"
            ></NodeSimpleChart>
          </template>
        </CardPanel>
      </a-col>
    </a-row>
  </div>
  <a-modal v-model:open="editDialog.status" :title="editDialog.title">
    <a-form layout="vertical">
      <a-form-item>
        <a-typography-title :level="5">{{ t("备注信息") }}</a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("必填，支持中文，用于填写相关备注信息") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="editDialog.data.remarks" />
      </a-form-item>

      <a-form-item>
        <a-typography-title :level="5">{{ t("远程节点所在主机的 IP 地址") }}</a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("必须使用外网地址或 localhost 地址，否则将导致远程实例无法连接") }}
            <br />
            {{ t("必填，例如 mcsmanager.com，43.123.211.12") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="editDialog.data.ip" />
      </a-form-item>

      <a-form-item>
        <a-typography-title :level="5">{{ t("远程节点端口") }}</a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("必填，例如 24444") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="editDialog.data.port" />
      </a-form-item>

      <a-form-item>
        <a-typography-title class="flex" :level="5">
          {{ t("验证密钥") }}
          <div v-if="editMode">{{ t("（留空则不修改）") }}</div>
        </a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("在远程节点启动时控制台上会输出显示，务必确保密钥安全") }}
            <br />
            {{ t("在 Linux 下，密钥一般在 /opt/mcsmanager/daemon/data/Config/global.json 中") }}
            <br />
            {{ t("必填，例如 6ff0fa1ef9a943f3c6f2fe0e4564a2fa383d35c4b78ccb5") }}
            <br />
            <a href="https://docs.mcsmanager.com/" target="_blank">{{ t("如何获取密钥？") }}</a>
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="editDialog.data.apiKey" />
      </a-form-item>
    </a-form>
    <template #footer>
      <div class="justify-space-between">
        <a-popconfirm
          :title="t('确定要永久删除该节点吗？')"
          ok-text="Yes"
          cancel-text="No"
          @confirm="deleteNode()"
        >
          <a-button v-if="editMode" key="delete">{{ t("删除节点") }}</a-button>
        </a-popconfirm>
        <div class="right">
          <a-button key="back" @click="editDialog.hidden()">{{ t("取消") }}</a-button>
          <a-button
            key="submit"
            type="primary"
            :loading="editDialog.loading"
            @click="editDialog.submit()"
          >
            {{ t("确定") }}
          </a-button>
        </div>
      </div>
    </template>
  </a-modal>
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
