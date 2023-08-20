import { computed } from 'vue'
import { useRoute } from 'vue-router'

export function useRouterParams() {
  const route = useRoute()

  // 使用computed属性获取当前路由路径
  const currentRoutePath = computed(() => route.path)

  return {
    currentRoutePath
  }
}
