import { LoadingOutlined } from "@ant-design/icons-vue";
import { h } from "vue";

export function getLoadingIcon(fontSize = 24) {
  const icon = h(LoadingOutlined, {
    style: {
      fontSize: `${fontSize}px`
    },
    spin: true
  });
  return icon;
}
