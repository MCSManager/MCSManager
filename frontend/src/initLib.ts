import { Spin } from "ant-design-vue";
import { LoadingOutlined } from "@ant-design/icons-vue";
import { h } from "vue";

Spin.setDefaultIndicator({
  indicator: h(LoadingOutlined, {
    style: {
      fontSize: "24px"
    },
    spin: true
  })
});
