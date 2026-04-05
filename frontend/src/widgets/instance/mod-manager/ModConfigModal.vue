<script setup lang="ts">
import { t } from "@/lang/i18n";
import {
  Modal,
  List,
  ListItem,
  ListItemMeta,
  Button
} from "ant-design-vue";
import { FileTextOutlined } from "@ant-design/icons-vue";

defineProps<{
  visible: boolean;
  currentMod: any;
  configLoading: boolean;
  configFiles: any[];
}>();

const emit = defineEmits(["update:visible", "edit"]);
</script>

<template>
  <Modal
    :visible="visible"
    @update:visible="val => emit('update:visible', val)"
    :title="t('TXT_CODE_CONFIG') + ': ' + currentMod?.name"
    :footer="null"
  >
    <List :loading="configLoading" :data-source="configFiles">
      <template #renderItem="{ item }">
        <ListItem>
          <ListItemMeta :title="item.name" :description="item.path">
            <template #avatar>
              <FileTextOutlined />
            </template>
          </ListItemMeta>
          <template #actions>
            <Button type="link" @click="emit('edit', item)">{{ t("TXT_CODE_EDIT") }}</Button>
          </template>
        </ListItem>
      </template>
    </List>
  </Modal>
</template>
