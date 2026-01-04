<script setup lang="ts">
import { computed } from "vue";
import { t } from "@/lang/i18n";
import { useScreen } from "@/hooks/useScreen";
import {
  Modal,
  Table,
  Tag,
  Button
} from "ant-design-vue";

const props = defineProps<{
  visible: boolean;
  selectedMod: any;
  versions: any[];
  versionsLoading: boolean;
  searchFilters: any;
  mods: any[];
}>();

const emit = defineEmits(["update:visible", "download"]);

const { isPhone } = useScreen();

const sortedVersions = computed(() => {
  if (!props.versions) return [];
  const vFilter = props.searchFilters.version;
  const lFilter = props.searchFilters.loader;

  if (!vFilter && !lFilter) return props.versions;

  return [...props.versions].sort((a, b) => {
    const aMatchV = vFilter ? a.game_versions?.includes(vFilter) : false;
    const aMatchL = lFilter ? a.loaders?.some((l: string) => l.toLowerCase() === lFilter.toLowerCase()) : false;
    const bMatchV = vFilter ? b.game_versions?.includes(vFilter) : false;
    const bMatchL = lFilter ? b.loaders?.some((l: string) => l.toLowerCase() === lFilter.toLowerCase()) : false;

    const aScore = (aMatchV ? 2 : 0) + (aMatchL ? 1 : 0);
    const bScore = (bMatchV ? 2 : 0) + (bMatchL ? 1 : 0);

    if (aScore !== bScore) return bScore - aScore;
    return 0;
  });
});

const columns = computed(() => {
  const base = [
    { title: t("TXT_CODE_VERSION_NAME"), dataIndex: "name", key: "name" },
    { title: t("TXT_CODE_VERSION_NUMBER"), dataIndex: "version_number", key: "version_number" },
    { title: t("TXT_CODE_GAME_VERSION"), dataIndex: "game_versions", key: "game_versions" },
    { title: t("TXT_CODE_LOADER"), dataIndex: "loaders", key: "loaders" },
    { title: t("TXT_CODE_OPERATE"), key: "action" }
  ];
  return isPhone.value ? base.filter(c => ["name", "action"].includes(c.key!)) : base;
});
</script>

<template>
  <Modal
    :visible="visible"
    @update:visible="val => emit('update:visible', val)"
    :title="selectedMod?.title + ' - ' + t('TXT_CODE_VERSION_SELECT')"
    :footer="null"
    :width="isPhone ? '100%' : '800px'"
  >
    <Table
      :loading="versionsLoading"
      :dataSource="sortedVersions"
      :columns="columns"
      rowKey="id"
      :size="isPhone ? 'small' : 'middle'"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'game_versions'">
          <Tag
            v-for="v in record.game_versions.slice(0, 3)"
            :key="v"
            :color="v === searchFilters.version ? 'blue' : ''"
          >
            {{ v }}
          </Tag>
        </template>
        <template v-if="column.key === 'loaders'">
          <Tag
            v-for="l in record.loaders"
            :key="l"
            :color="l.toLowerCase() === searchFilters.loader.toLowerCase() ? 'green' : 'orange'"
          >
            {{ l }}
          </Tag>
        </template>
        <template v-if="column.key === 'action'">
          <Button
            type="primary"
            size="small"
            :disabled="mods.some((m) => m.extraInfo?.version?.id === record.id)"
            @click="emit('download', record)"
          >
            {{ mods.some((m) => m.extraInfo?.version?.id === record.id) ? t("TXT_CODE_CURRENT_VERSION") : t("TXT_CODE_DOWNLOAD") }}
          </Button>
        </template>
      </template>
    </Table>
  </Modal>
</template>
