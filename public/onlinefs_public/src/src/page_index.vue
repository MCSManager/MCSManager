<template lang="html">
  <div id="m-container" class=" container">
    <div class="row">
      <div class="m-header">
        <p>
          <span style="color: #ffffff;">控制面板 - 文件管理</span>
        </p>
      </div>
      <div class="container m-panel">
        <div class="row">
          <div class="col-md-3">
            <div id="vm-leftm-items">
              <component-lmuem :files-hub="filesHub"></component-lmuem>
            </div>
          </div>
          <div class="col-md-9">
            <div id="m-right-container">
              <div id="vm-files-items">
                <component-files  :common-hub="filesHub"></component-files>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <component-editor :is-display="editorDisplay" :save-callback="editorCallback" :textareaContext="editorOpenContext" :editorFilename="editorFilename"></component-editor>
    <component-shady :is-display="editorDisplay"></component-shady>
  </div>
</template>

<script>
import Vue from "vue";
import componentLmuem from "./components/lmuem";
import componentFiles from "./components/files";
import componentEditor from "./components/editor";
import componentShady from "./components/shady";
import funcModule from "./module/function";
import hubModule from "./module/hub";

//文件事件 Hub
const filesHub = hubModule.Hub;

//首页数据模型为全局
MCSERVER.pageIndexModel = {
  filesHub: filesHub,
  editorDisplay: false,
  editorCallback: obj => {},
  editorOpenContext: "",
  editorFilename: ""
};

//首页 Vue 组件
export default {
  name: "page_index",
  components: {
    componentLmuem,
    componentFiles,
    componentEditor,
    componentShady
  },
  data: function() {
    return MCSERVER.pageIndexModel;
  }
};
</script>
