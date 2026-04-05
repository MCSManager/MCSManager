<template>
  <div>
    <a-modal
      v-model:open="state.inputDialog.show"
      centered
      :title="state.inputDialog.title"
      :width="400"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <div class="dialog-input-container">
        <a-input v-model:value="inputValue" :placeholder="state.inputDialog.title" />
      </div>
    </a-modal>
  </div>
</template>
<script lang="ts" setup>
import { useAppToolsStore } from "@/stores/useAppToolsStore";
import { ref } from "vue";

const inputValue = ref("");

const { state } = useAppToolsStore();

const handleOk = (e: MouseEvent) => {
  state.inputDialog.resolve(JSON.parse(JSON.stringify(inputValue.value)));
  state.inputDialog.show = false;
  inputValue.value = "";
};

const handleCancel = (e: MouseEvent) => {
  state.inputDialog.reject(new Error("Dialog closed by user"));
  state.inputDialog.show = false;
  inputValue.value = "";
};
</script>

<style lang="scss">
.dialog-input-container {
  margin: 20px 0px;
}
</style>
