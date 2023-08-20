<script setup lang="ts">
import type { LayoutCard } from "@/types";
import CardPanel from "@/components/CardPanel.vue";
import { useRoute } from "vue-router";

const props = defineProps<{
  card: LayoutCard;
}>();

// 如果 meta 参数包含数值，则应该使用 meta 传递而来的参数。
// 用户在新增卡片时会被要求补充 meta 参数。
// 这样的好处是可以实现卡片被放置在任意界面。
let { instanceId, daemonId } = props.card.meta ?? {};

// 如果 Meta 中不包含实例 ID 和节点 ID，那么就需要从路由中获取 route 上的参数
const route = useRoute();
if (!instanceId || !daemonId) {
  instanceId = route.query.instanceId ?? "";
  daemonId = route.query.daemonId ?? "";
}
</script>

<template>
  <div style="height: 100%">
    <CardPanel style="height: 100%">
      <template #title>{{ card.title }}</template>
      <template #body>
        <div v-if="instanceId && daemonId">
          <p>参数值：{{ instanceId }}, {{ daemonId }}</p>
          <p>
            接下来可以使用这些参数去获取对应的数据，比如「实例」的状态信息，这样便可以实现在首页显示某个指定实例数据的效果。
          </p>
        </div>
        <div v-else>请完善实例ID和节点ID等相关参数。</div>
      </template>
    </CardPanel>
  </div>
</template>
