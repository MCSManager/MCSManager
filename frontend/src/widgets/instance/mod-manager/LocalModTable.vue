<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useScreen } from "@/hooks/useScreen";
import {
  SettingOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  DownOutlined,
  InfoCircleOutlined
} from "@ant-design/icons-vue";

defineProps<{
  loading: boolean;
  dataSource: any[];
  columns: any[];
  pagination: any;
}>();

const emit = defineEmits(["toggle", "delete", "config", "refresh", "change", "openExternal"]);

const { t } = useI18n();
const { isPhone } = useScreen();
</script>

<template>
  <a-table
    :loading="loading"
    :dataSource="dataSource"
    :columns="columns"
    rowKey="file"
    class="mb-6"
    :size="isPhone ? 'small' : 'middle'"
    :pagination="pagination"
    @change="(p: any) => emit('change', p)"
  >
    <template #headerCell="{ column }">
      <span v-if="column.title" class="font-bold">{{ column.title }}</span>
    </template>
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'icon'">
        <a-avatar
          v-if="record.extraInfo?.project?.icon_url"
          :src="record.extraInfo.project.icon_url"
          shape="square"
        />
        <a-avatar v-else shape="square">
          {{ record.name.charAt(0).toUpperCase() }}
        </a-avatar>
      </template>
      <template v-if="column.key === 'name'">
        <div class="flex flex-col overflow-hidden text-left" style="min-width: 0">
          <div class="font-bold text-[15px] truncate w-full whitespace-nowrap" :title="record.name">
            {{ record.name || record.file }}
          </div>
          <!-- Mobile only: show version and status -->
          <div v-if="isPhone" class="flex items-center gap-2 mt-0.5 whitespace-nowrap">
            <span class="text-[11px] opacity-60 font-mono bg-gray-500/10 px-1 rounded">
              {{ record.version || t("TXT_CODE_UNKNOWN_VERSION") }}
            </span>
            <span :class="['text-[10px] font-bold', record.enabled ? 'text-green-500' : 'text-red-500']">
              {{ record.enabled ? t("TXT_CODE_ENABLED") : t("TXT_CODE_DISABLED") }}
            </span>
          </div>
          <div
            class="text-xs opacity-60 truncate w-full mt-0.5 whitespace-nowrap"
            v-if="record.extraInfo?.project?.description"
            :title="record.extraInfo.project.description"
          >
            {{ record.extraInfo.project.description }}
          </div>
          <div v-else-if="record.name && record.file !== record.name" class="text-[11px] opacity-40 truncate w-full mt-0.5 whitespace-nowrap">
            {{ record.file }}
          </div>
        </div>
      </template>
      <template v-if="column.key === 'version'">
        <div class="truncate w-full font-mono text-xs opacity-80" :title="record.version" style="min-width: 0">
          {{ record.version || t("TXT_CODE_UNKNOWN_VERSION") }}
        </div>
      </template>
      <template v-if="column.key === 'enabled'">
        <a-tag :color="record.enabled ? 'green' : 'red'">
          {{ record.enabled ? t("TXT_CODE_ENABLED") : t("TXT_CODE_DISABLED") }}
        </a-tag>
      </template>
      <template v-if="column.key === 'type'">
        <a-tag color="blue">{{ record.type }}</a-tag>
      </template>
      <template v-if="column.key === 'action'">
        <div class="flex justify-center">
          <template v-if="isPhone">
            <a-dropdown :trigger="['click']">
              <a-button size="small">
                {{ t("TXT_CODE_OPERATE") }}
                <down-outlined />
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="emit('toggle', record)">
                    <template #icon>
                      <pause-circle-outlined v-if="record.enabled" />
                      <play-circle-outlined v-else />
                    </template>
                    {{ record.enabled ? t("TXT_CODE_DISABLE") : t("TXT_CODE_ENABLE") }}
                  </a-menu-item>
                  <a-menu-item
                    @click="emit('openExternal', { id: record.extraInfo?.project?.id, source: record.extraInfo?.source, slug: record.extraInfo?.project?.slug, name: record.name || record.file })"
                  >
                    <template #icon><info-circle-outlined /></template>
                    {{ t("TXT_CODE_f1b166e7") }}
                  </a-menu-item>
                  <a-menu-item danger @click="emit('delete', record)">
                    <template #icon><delete-outlined /></template>
                    {{ t("TXT_CODE_6f2c1806") }}
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
          <a-space v-else :size="12">
            <a-button
              type="text"
              size="small"
              @click="emit('openExternal', { id: record.extraInfo?.project?.id, source: record.extraInfo?.source, slug: record.extraInfo?.project?.slug, name: record.name || record.file })"
              class="opacity-60 hover:opacity-100"
              :title="t('TXT_CODE_f1b166e7')"
            >
              <template #icon><info-circle-outlined style="font-size: 16px" /></template>
            </a-button>
            <a-button
              type="text"
              size="small"
              @click="emit('config', record)"
              class="opacity-60 hover:opacity-100"
              :title="t('TXT_CODE_CONFIG')"
            >
              <template #icon><setting-outlined style="font-size: 16px" /></template>
            </a-button>
            <a-button
              type="text"
              size="small"
              @click="emit('toggle', record)"
              class="opacity-60 hover:opacity-100"
              :title="record.enabled ? t('TXT_CODE_DISABLE') : t('TXT_CODE_ENABLE')"
            >
              <template #icon>
                <pause-circle-outlined v-if="record.enabled" style="font-size: 16px" />
                <play-circle-outlined v-else style="font-size: 16px" />
              </template>
            </a-button>
            <a-popconfirm
              :title="t('TXT_CODE_71155575')"
              @confirm="emit('delete', record)"
              :ok-text="t('TXT_CODE_d507abff')"
              :cancel-text="t('TXT_CODE_a0451c97')"
            >
              <a-button
                type="link"
                size="small"
                danger
                :title="t('TXT_CODE_6f2c1806')"
              >
                <template #icon><delete-outlined style="font-size: 16px" /></template>
              </a-button>
            </a-popconfirm>
          </a-space>
        </div>
      </template>
    </template>
  </a-table>
</template>
