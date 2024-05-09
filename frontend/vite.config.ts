import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import Components from "unplugin-vue-components/vite";
import { AntDesignVueResolver } from "unplugin-vue-components/resolvers";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/ant-design-vue/es")) {
            return "ant-es";
          }
          if (id.includes("node_modules/ant-design-vue")) {
            return "ant";
          }
          if (id.includes("node_modules/echarts")) {
            return "echart";
          }
          if (id.includes("node_modules/zrender")) {
            return "zrender";
          }
          if (id.includes("node_modules/vue") || id.includes("node_modules/@vue")) {
            return "vue";
          }
          if (id.includes("node_modules/xterm")) {
            return "xterm";
          }
          if (id.includes("node_modules/@codemirror")) {
            return "codemirror";
          }
          if (id.includes("node_modules/monaco")) {
            return "monaco";
          }
          if (id.includes("node_modules/htmlparser2")) {
            return "htmlparser2";
          }
        }
      }
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:23333",
        changeOrigin: true,
        ws: true
      },
      "/upload_files": {
        target: "http://localhost:23333",
        changeOrigin: true
      },
      "/socket.io": {
        target: "ws://localhost:23333",
        ws: true
      }
    }
  },

  plugins: [
    vue(),
    vueJsx(),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: false // css in js
        })
      ]
    }),
    visualizer()
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@languages": fileURLToPath(new URL("../languages", import.meta.url))
    }
  },
  base: "./"
});
