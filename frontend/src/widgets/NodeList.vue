<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { ref } from "vue";
import { t } from "@/lang/i18n";
import { SearchOutlined, UserOutlined } from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const operationForm = ref({
  name: "",
});

const arr = [
  1, 2, 3, 4, 5, 6, 7, 8, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
];
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template #left>
            <a-typography-title class="mb-0" :level="5">
              {{ card.title }}
            </a-typography-title>
          </template>
          <template #right>
            <a-button class="mr-6" type="primary">{{ t("新增节点") }}</a-button>
            <a-button>{{ t("使用手册") }}</a-button>
          </template>
          <template #center>
            <div class="search-input">
              <a-input
                v-model:value="operationForm.name"
                :placeholder="t('根据节点名字搜索')"
              >
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
          {{
            t(
              "远程节点上的应用程序的控制台，文件上传，文件下载都需要网页能够直接连接远程节点。"
            )
          }}
          <br />
          {{
            t(
              "因此必须避免使用除 localhost 外的局域网段任何 IP，必须使用外网 IP 或域名进行连接。"
            )
          }}
        </a-typography-text>
      </a-col>

      <a-col :span="24" :lg="12" v-for="item in arr" :key="item">
        <CardPanel style="height: 100%">
          <template #title>我的程序</template>
          <template #body>
            卡片示例 <br />
            测试信息
            <p>
              我是测试信息113sadklasndfiasbifoashiofhwoifhopiashdoias iofan
              oiqwoie rhiwoh oiwa doiaw oid owiaydhoia ocaoshd oiadh oiadhioas
              doiashd oa o123123
            </p>
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
