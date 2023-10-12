<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types/index";
import { DownloadOutlined } from "@ant-design/icons-vue";
import { quickInstallListAddr, createAsyncTask, queryAsyncTask } from "@/services/apis/instance";
import { message } from "ant-design-vue";
import Loading from "@/components/Loading.vue";
import type { QuickStartTemplate } from "@/types";
import { useAppToolsStore } from "@/stores/useAppToolsStore";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { router } from "@/config/router";

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const { openInputDialog } = useAppToolsStore();
const daemonId = getMetaOrRouteValue("remoteUuid") ?? "";
const dialog = reactive({
  show: false,
  title: "Dialog"
});

const {
  state: appList,
  execute: getQuickInstallListAddr,
  isLoading: appListLoading
} = quickInstallListAddr();

const init = async () => {
  try {
    await getQuickInstallListAddr();

    if (!appList.value || appList.value.length === 0) {
      dialog.title = t("正在维护中");
      dialog.show = true;
    }
  } catch (err: any) {
    console.error(err.message);
    return message.error(err.message);
  }
};

const installView = ref(false);
const intervalTask = ref<NodeJS.Timer>();
const percentage = ref(0);
const isInstalled = ref(false);

const { state: newTaskInfo, execute: executeCreateAsyncTask } = createAsyncTask();

const handleSelectTemplate = async (item: QuickStartTemplate) => {
  try {
    const instanceName = await openInputDialog(t("请输入新实例的名字"));
    await executeCreateAsyncTask({
      params: {
        remote_uuid: daemonId,
        uuid: "-",
        task_name: "quick_install"
      },
      data: {
        time: new Date().getTime(),
        newInstanceName: instanceName as string,
        targetLink: item.targetLink
      }
    });
    installView.value = true;
    isInstalled.value = false;
    percentage.value = 0;
    await startDownloadTask();
  } catch (err: any) {
    console.error(err);
    return message.error(err.message);
  }
};

const startDownloadTask = async () => {
  if (intervalTask.value) clearInterval(intervalTask.value);
  dialog.title = t("正在安装中");
  dialog.show = true;
  await queryStatus();
  intervalTask.value = setInterval(async () => {
    if (percentage.value <= 95) percentage.value += Math.floor(Math.random() * 6) + 1;
    await queryStatus();
  }, 3000);
};

const { state: taskInfo, execute: queryAsyncTaskStatus } = queryAsyncTask();

const queryStatus = async () => {
  try {
    if (!newTaskInfo.value) throw new Error("newTaskInfo is null");
    await queryAsyncTaskStatus({
      params: {
        remote_uuid: daemonId,
        uuid: "-",
        task_name: "quick_install"
      },
      data: {
        taskId: newTaskInfo.value.taskId
      }
    });
    if (taskInfo.value?.status === -1) {
      percentage.value = 100;
      dialog.title = t("安装错误");
      installView.value = true;
      isInstalled.value = false;
      clearInterval(intervalTask.value);
    }

    if (taskInfo.value?.status === 0) {
      percentage.value = 100;
      dialog.title = t("安装完毕");
      installView.value = false;
      isInstalled.value = true;
      clearInterval(intervalTask.value);
    }
  } catch (err: any) {
    console.error(err);
    return message.error(err.message);
  }
};

const toAppDetailPage = () => {
  const instanceId = taskInfo.value?.detail.instanceUuid;
  router.push({
    path: "/instances/terminal",
    query: {
      daemonId,
      instanceId
    }
  });
};

const toCreateInstancePage = () => {
  router.push({
    path: "/quickstart"
  });
};

onMounted(async () => {
  await init();
});
</script>

<template>
  <div style="height: 100%">
    <a-row v-if="appListLoading" :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <div style="height: 50vh">
          <Loading />
        </div>
      </a-col>
    </a-row>
    <a-row v-else :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24" :md="24">
        <CardPanel style="height: 100%">
          <template #title>{{ t("注意事项") }}</template>
          <template #body>
            <a-typography-paragraph>
              <a-typography-text>
                {{ t("安装预设整合包将视作你已同意并阅读")
                }}<a href="https://aka.ms/MinecraftEULA" target="_blank" rel="noopener noreferrer">
                  {{ t("Minecraft 最终用户协议（EULA)") }}
                </a>
              </a-typography-text>
              <br />
              <a-typography-text class="color-info">
                {{ t("快速安装服务由独醉科技提供文件下载支持") }}
              </a-typography-text>
            </a-typography-paragraph>
          </template>
        </CardPanel>
      </a-col>
      <a-col v-for="(item, i) in appList" :key="i" :span="24" :xl="6" :lg="8" :sm="12">
        <div style="display: flex; flex-grow: 1; flex-direction: column; height: 100%">
          <CardPanel style="flex-grow: 1">
            <template #title>{{ item.mc }}</template>
            <template #body>
              <div style="height: 13em">
                <a-typography-paragraph
                  :ellipsis="{ rows: 3, expandable: true, symbol: t('查看更多') }"
                  :content="item.info"
                >
                </a-typography-paragraph>
                <a-typography-paragraph>
                  <a-typography-text class="color-info">
                    {{ t("Java版本要求") }}: {{ item.java }}
                  </a-typography-text>
                  <br />
                  <a-typography-text class="color-info">
                    {{ t("整合包大小") }}: {{ item.size }} MB
                  </a-typography-text>
                  <br />
                  <a-typography-text class="color-info">
                    {{ item.remark }}
                  </a-typography-text>
                </a-typography-paragraph>
              </div>

              <a-button block @click="handleSelectTemplate(item)">
                <template #icon>
                  <DownloadOutlined />
                </template>
                {{ t("安装") }}
              </a-button>
            </template>
          </CardPanel>
        </div>
      </a-col>
    </a-row>

    <a-modal
      v-model:open="dialog.show"
      :title="dialog.title"
      :mask-closable="false"
      :closable="false"
      :footer="null"
      centered
    >
      <div v-if="!appList || appList.length === 0">
        <a-typography-text>
          {{ t("很抱歉，无法获取最新预设整合包列表，可能是您的网络问题或服务器正在维护中。") }}
        </a-typography-text>
        <a-button @click="toCreateInstancePage()">{{ t("返回手动安装") }}</a-button>
      </div>
      <div v-if="installView || isInstalled" style="text-align: center">
        <a-progress
          style="display: block; margin-bottom: 10px"
          type="circle"
          :percent="percentage"
          :status="taskInfo?.status === -1 ? 'exception' : ''"
        />
        <div v-if="installView">
          <div v-if="taskInfo?.status !== -1">
            <a-typography-paragraph>
              <a-typography-title :level="5">{{ t("正在下载文件...") }}</a-typography-title>
              <a-typography-text>
                {{ t("实际所需时间与网速，处理器运行速度有关，请务必耐心等待。") }}
              </a-typography-text>
            </a-typography-paragraph>
          </div>
          <div v-if="taskInfo?.status === -1">
            <a-typography-paragraph>
              <a-typography-title :level="5">{{ t("安装错误") }}</a-typography-title>
              <a-typography-text>
                {{
                  t(
                    "可能是因为网络不通畅或服务器正在维护中，请等待一段时间后再进行尝试，或使用其他安装包尝试。"
                  )
                }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-button size="" class="mr-10" @click="toCreateInstancePage()">
              {{ t("返回手动安装") }}
            </a-button>
            <a-button type="primary" size="" danger @click="dialog.show = false">
              {{ t("关闭") }}
            </a-button>
          </div>
        </div>
        <div v-if="isInstalled">
          <a-typography-paragraph>
            <a-typography-title :level="5">{{ t("安装完毕") }}</a-typography-title>
            <a-typography-text>
              {{ t("大功告成！接下来您只需要进入“实例控制台”，轻点“启动实例”即可。") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-button @click="toAppDetailPage()">{{ t("前往实例控制台") }}</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>
