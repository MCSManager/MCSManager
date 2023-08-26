import { LoadingOutlined } from "@ant-design/icons-vue";
import { h } from "vue";

export async function sleep(t: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, t));
}

export async function loadingIconFc(fontSize = 24) {
  const indicator = h(LoadingOutlined, {
    style: {
      fontSize: `${fontSize}px`
    },
    spin: true
  });
  return indicator;
}
