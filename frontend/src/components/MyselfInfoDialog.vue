<script setup lang="ts">
import LeftMenusPanel from "@/components/LeftMenusPanel.vue";
import { t } from "@/lang/i18n";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { useAppToolsStore } from "@/stores/useAppToolsStore";
import type { LayoutCard } from "@/types/index";
import { ProjectOutlined, RobotOutlined } from "@ant-design/icons-vue";
import { reactive, ref, toRaw } from "vue";
const { state } = useAppStateStore();
const { state: tools } = useAppToolsStore();

const menus = [
  {
    title: t("基本信息"),
    key: "baseInfo",
    icon: ProjectOutlined
  },
  {
    title: t("第三方接口"),
    key: "api",
    icon: RobotOutlined
  },
  {
    title: t("账号安全"),
    key: "password",
    icon: RobotOutlined
  }
];

const formState = reactive({
  name: "",
  delivery: false,
  type: [],
  resource: "",
  desc: ""
});
const onSubmit = () => {
  console.log("submit!", toRaw(formState));
};
</script>

<template>
  <a-modal
    v-model:open="tools.showUserInfoDialog"
    :title="t('用户信息')"
    centered
    @ok="tools.showUserInfoDialog = false"
  >
    <div>
      <a-form :model="formState" layout="vertical">
        <a-form-item :label="t('用户ID')">
          <span>{{ state.userInfo?.uuid }}</span>
        </a-form-item>
        <a-form-item :label="t('用户名')">
          <span>{{ state.userInfo?.userName }}</span>
        </a-form-item>
        <a-form-item :label="t('权限等级')">
          <span>{{ state.userInfo?.permission }}</span>
        </a-form-item>
      </a-form>
      <!-- <LeftMenusPanel :menus="menus">
        <template #baseInfo>
          A
        </template>
        <template #api>
          {{ state.userInfo }}
        </template>
      </LeftMenusPanel> -->
    </div>
  </a-modal>
</template>

<style lang="scss" scoped>
.full-modal {
  .ant-modal {
    max-width: 100%;
    top: 0;
    padding-bottom: 0;
    margin: 0;
  }
  .ant-modal-content {
    display: flex;
    flex-direction: column;
    height: calc(100vh);
  }
  .ant-modal-body {
    flex: 1;
  }
}
</style>
