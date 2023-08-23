<script setup lang="ts">
import LeftMenusPanel from "@/components/LeftMenusPanel.vue";
import { t } from "@/lang/i18n";
import { useAppStateStore } from "@/stores/useAppStateStore";
import type { LayoutCard } from "@/types/index";
import { ProjectOutlined, RobotOutlined } from "@ant-design/icons-vue";
import { reactive, toRaw } from "vue";
const { state } = useAppStateStore();

const props = defineProps<{
  card: LayoutCard;
}>();

const menus = [
  {
    title: t("基本信息"),
    key: "baseInfo",
    icon: ProjectOutlined
  },
  {
    title: t("API接口"),
    key: "api",
    icon: RobotOutlined
  }
  // {
  //   title: t("注册时间"),
  //   key: "1145/1/4 19:18:10"
  // },
  // {
  //   title: t("最后登录"),
  //   key: "2023/8/14 13:21:56"
  // },
  // {
  //   title: t("唯一标识符"),
  //   key: "229458f9ec6f47f4a1d46a95cd1ed171"
  // }
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
const labelCol = { style: { width: "150px" } };
const wrapperCol = { span: 14 };
</script>

<template>
  <div style="height: 100%">
    <LeftMenusPanel :menus="menus">
      <template #baseInfo>
        <a-form
          :model="formState"
          :label-col="labelCol"
          :wrapper-col="wrapperCol"
          label-align="left"
        >
          <a-form-item label="Activity name">
            <a-input v-model:value="formState.name" />
          </a-form-item>
          <a-form-item label="Instant delivery">
            <a-switch v-model:checked="formState.delivery" />
          </a-form-item>
          <a-form-item label="Activity type">
            <a-checkbox-group v-model:value="formState.type">
              <a-checkbox value="1" name="type">Online</a-checkbox>
              <a-checkbox value="2" name="type">Promotion</a-checkbox>
              <a-checkbox value="3" name="type">Offline</a-checkbox>
            </a-checkbox-group>
          </a-form-item>
          <a-form-item label="Resources">
            <a-radio-group v-model:value="formState.resource">
              <a-radio value="1">Sponsor</a-radio>
              <a-radio value="2">Venue</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="Resources">
            <a-radio-group v-model:value="formState.resource">
              <a-radio value="1">Sponsor</a-radio>
              <a-radio value="2">Venue</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="Activity form">
            <a-textarea v-model:value="formState.desc" />
          </a-form-item>
          <a-form-item :wrapper-col="{ span: 14, offset: 4 }">
            <a-button type="primary" @click="onSubmit">Create</a-button>
            <a-button style="margin-left: 10px">Cancel</a-button>
          </a-form-item>
        </a-form>
      </template>
      <template #api>
        {{ state.userInfo }}
      </template>
    </LeftMenusPanel>
  </div>
</template>
