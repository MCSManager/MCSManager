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
    sourcemap: true,
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks(path) {
          if (path.includes("node_modules/ant-design-vue/es")) {
            return "ant-es";
          }
          if (path.includes("node_modules/ant-design-vue")) {
            return "ant";
          }
          if (path.includes("node_modules/zrender")) {
            return "zrender";
          }
          if (path.includes("node_modules/echarts")) {
            return "echart";
          }
          if (path.includes("node_modules/lodash")) {
            return "lodash";
          }
          if (path.includes("node_modules/vue") || path.includes("node_modules/@vue")) {
            return "vue";
          }
          if (path.includes("node_modules/xterm")) {
            return "xterm";
          }
          if (path.includes("node_modules/@codemirror")) {
            return "codemirror";
          }
          if (path.includes("node_modules/monaco")) {
            return "monaco";
          }
          if (path.includes("node_modules/htmlparser2")) {
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
    visualizer({ emitFile: true, filename: "stats.html" })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@languages": fileURLToPath(new URL("../languages", import.meta.url))
    }
  },
  base: "./"
});
