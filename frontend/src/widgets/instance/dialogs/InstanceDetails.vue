<script setup lang="ts">
import { ref, computed } from "vue";
import { t } from "@/lang/i18n";
import { useScreen } from "@/hooks/useScreen";
import type { InstanceDetail } from "@/types";
import { updateAnyInstanceConfig } from "@/services/apis/instance";
import { message } from "ant-design-vue";
import { TERMINAL_CODE } from "@/types/const";
const props = defineProps<{
  instanceInfo?: InstanceDetail;
  instanceId?: string;
  daemonId?: string;
}>();
const emit = defineEmits(["update"]);
const options = ref<InstanceDetail>();

const screen = useScreen();
const isPhone = computed(() => screen.isPhone.value);
const open = ref(false);
const openDialog = () => {
  open.value = true;
  options.value = props.instanceInfo;
};

const { execute, isLoading } = updateAnyInstanceConfig();

const submit = async () => {
  try {
    options.value &&
      (await execute({
        params: {
          uuid: props.instanceId ?? "",
          remote_uuid: props.daemonId ?? ""
        },
        data: options.value.config
      }));
    emit("update");
    open.value = false;
    return message.success(t("TXT_CODE_d3de39b4"));
  } catch (err: any) {
    return message.error(err.message);
  }
};

defineExpose({
  openDialog
});
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    :width="isPhone ? '100%' : 'calc(100% - 30vw)'"
    :title="t('实例详细信息设置')"
    :confirm-loading="isLoading"
    :ok-text="t('保存')"
    @ok="submit"
  >
    <a-form v-if="options" layout="vertical">
      <a-row :gutter="20">
        <a-col :xs="24" :lg="18" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("注意事项") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{
                  t(
                    "当前界面所有设置只有管理员可以进行更改，应用实例拥有远程代码执行功能，请谨慎修改配置。"
                  )
                }}
              </a-typography-text>
            </a-typography-paragraph>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :lg="6" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("分配给其他用户") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ options.config.processType }}
              </a-typography-text>
            </a-typography-paragraph>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :md="12" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("实例名称") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary" :class="!isPhone && 'two-line-height'">
                {{ t("支持中文，尽可能保证唯一性") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-input v-model:value="options.config.nickname" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :md="12" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("实例类型") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{
                  t(
                    "不同类型会导致功能不同，若无需求类型，可以选择较为抽象的通用类型，例如 Java 通用版服务端"
                  )
                }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-select v-model:value="options.config.type" :placeholder="t('请选择')">
              <a-select-option v-for="item in TERMINAL_CODE" :key="item" :value="item">
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>

        <a-col :xs="24" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("启动命令") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{
                  t(
                    "适用于任何程序命令，若程序路径或附加参数中含有空格可使用引号作为边界，包含的文本将视作一段整体。整条命令不可有换行。如果您输入命令无反应，或者终端排版错乱，可以开启 控制台-终端设置-伪终端进行尝试。不同类型会导致功能不同，若无需求类型，可以选择较为抽象的通用类型，例如 Java 通用版服务端通常情况下，建议使用命令助手生成启动命令，如果有额外需求可以自定义启动命令。列如 C: \Program Files\Java\bin\java.exe -Dfile.encoding=utf-8 -Djline.terminal=jline.UnsupportedTerminal -jar my server.jar -nogui"
                  )
                }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-input-group compact>
              <a-input
                v-model:value="options.config.startCommand"
                style="width: calc(100% - 88px)"
              />
              <a-button type="default">命令助手</a-button>
            </a-input-group>
          </a-form-item>
        </a-col>

        <a-col :xs="24" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("工作目录") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("实例运行的工作目录，可填绝对路径与相对路径") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-input v-model:value="options.config.cwd" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("更新/安装程序文件命令") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{
                  t(
                    "当用户执行更新/安装操作时，将会执行此命令，${mcsm_workspace} 代表工作目录，为空则不提供此功能"
                  )
                }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-input v-model:value="options.config.updateCommand" />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="20">
        <a-col :xs="24" :lg="6" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("文件管理编码") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary" :class="!isPhone && 'two-line-height'">
                {{ t("文件管理功能的解压缩，编辑等编码") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-select v-model:value="options.config.fileCode" :placeholder="t('请选择')">
              <a-select-option v-for="item in TERMINAL_CODE" :key="item" :value="item">
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :lg="6" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("到期时间") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary" :class="!isPhone && 'two-line-height'">
                {{ t("到期后实例将无法启动") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-date-picker
              v-model:value="options.config.endTime"
              size="large"
              style="width: 100%"
              :placeholder="t('请选择')"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :lg="12" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("进程启动方式（推荐）") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{
                  t(
                    "通常默认即可，如果从事商业活动则应当使用虚拟化容器启动方式，否则主机将可能被入侵。"
                  )
                }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-select v-model:value="options.config.processType">
              <a-select-option value="general">
                {{ t("默认类型") }}
              </a-select-option>
              <a-select-option value="docker">
                {{ t("虚拟化容器（Linux Docker）") }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      <a-row v-if="options.config.processType === 'docker'" :gutter="20">
        <a-col :xs="24" :lg="6" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("环境镜像") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("指定实例镜像") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-select
              v-model:value="options.config.docker.image"
              size="large"
              style="width: 100%"
              :placeholder="t('请选择')"
            >
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :lg="18" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("开放端口") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{
                  t(
                    "多个以空格分割，冒号左边为宿主机暴露端口，右边为容器暴露端口，通常保持一致即可"
                  )
                }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-input-group compact>
              <a-input
                v-model:value="options.config.docker.ports"
                style="width: calc(100% - 88px)"
              />
              <a-button type="default">快速编辑</a-button>
            </a-input-group>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("额外挂载路径") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{
                  t(
                    "向容器内挂载除工作目录外的其他目录，多个以空格分割，冒号左边为宿主机路径，右边为容器路径"
                  )
                }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-input-group compact>
              <a-input
                v-model:value="options.config.docker.extraVolumes"
                style="width: calc(100% - 88px)"
              />
              <a-button type="default">快速编辑</a-button>
            </a-input-group>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :lg="8" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("容器名") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("容器创建使用的名字，为空随机生成") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-input-group compact>
              <a-tooltip placement="bottom">
                <template #title>{{ t("选填，无特殊需求不建议填写此项") }}</template>
                <a-input
                  v-model:value="options.config.docker.containerName"
                  :placeholder="t('选填，示例 lobby-1')"
                  style="width: calc(100% - 88px)"
                />
              </a-tooltip>
              <a-button type="default">快速编辑</a-button>
            </a-input-group>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :lg="8" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("网络模式") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("选择容器接入的网络模式 如 bridge 网桥") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-select
              v-model:value="options.config.docker.networkMode"
              size="large"
              style="width: 100%"
              :placeholder="t('请选择')"
            >
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :lg="8" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("网络别名") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("用于在自定义网络中容器互相访问，空格分隔") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-input
              v-model:value="options.config.docker.networkAliases"
              :placeholder="t('选填，无特殊需求不建议填写此项')"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :lg="8" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("限制 CPU 使用率（百分比）") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("限制所有 CPU 总和使用率，会有少许偏差") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-tooltip placement="bottom">
              <template #title>
                {{
                  t(
                    "填写 50 代表所有核心使用率和限制在 50%，若填写 200 则代表准许使用所有核心使用率总和为 200%"
                  )
                }}
              </template>
              <a-input
                v-model:value="options.config.docker.cpuUsage"
                :placeholder="t('选填，0 到 无限大')"
              />
            </a-tooltip>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :lg="8" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("指定 CPU 计算核心") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("限制容器在指定的 CPU 核心上运行") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-tooltip placement="bottom">
              <template #title>
                {{
                  t(
                    "指定进程在某些核心上运行，合理分配可以更好的利用您的系统硬件资源，例如 0,1 代表在第1，2核心上运作，逗号隔开"
                  )
                }}
              </template>
              <a-input
                v-model:value="options.config.docker.cpusetCpus"
                :placeholder="t('选填，例如 0,1,2,3')"
              />
            </a-tooltip>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :lg="8" :offset="0">
          <a-form-item>
            <a-typography-title :level="5">{{ t("最大内存（单位 MB）") }}</a-typography-title>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("例如 1024，2048 等，请勿加单位") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-input
              v-model:value="options.config.docker.memory"
              :placeholder="t('选填，例如 1024')"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-modal>
</template>

<style scoped>
.two-line-height {
  display: block;
  height: 44px;
}
</style>
