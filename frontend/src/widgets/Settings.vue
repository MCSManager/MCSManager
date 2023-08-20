<script setup lang="ts">
import type { LayoutCard } from "@/types";
import { ref, onMounted } from "vue";
import { userService } from "@/services/user";
import { userInfoApi } from "../services/apis";

const props = defineProps<{
  card: LayoutCard;
}>();

const formData = ref({
  language: "en_US",
});

// const { getUserInfo } = userService();

// const { state, isLoading } = getUserInfo("777");

const { execute, isLoading, state, isReady } = userInfoApi();

onMounted(async () => {
  const info = await execute({
    params: {
      uid: "",
    },
    data: {
      newName: "newName",
    },
    method: "GET",
  });
});

const click = async () => {
  const d = await execute({
    params: {
      uid: "",
    },
    data: {
      newName: "newName",
    },
  });
  d.value!.id = 9999;
  console.log("XZXZX:", d.value);
};
</script>

<template>
  <CardPanel class="CardWrapper" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <div @click="() => click()">{{ state }}, {{ isLoading }}，{{ isReady }}</div>

      <!-- <div @click="click">{{ t2 }}, {{ t3 }}</div> -->

      <a-form :model="formData" layout="vertical">
        <a-form-item label="面板语言">
          <a-input v-model:value="formData.language" placeholder="input placeholder" />
        </a-form-item>
      </a-form>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.CardWrapper {
  .tab {
  }
}
</style>
