<template lang="html">
    <div id="editor_box" class="container" v-show="isDisplay">
      <div class="editor_wapper">
          <!-- 文本内容 -->
          <textarea style="margin: 0px; width: 100%; height: 94%;resize: none;" v-model="textareaContext">
          </textarea>
          <!-- 控制按钮 -->
          <div class="editor_button">
            <span>您正在编辑 {{ editorFilename }} 文件</span>
             <button type="button" class="btn btn-default btn-success" @click="savetextareaContext()">保存</button>
             <button type="button" class="btn btn-default btn-danger" @click="cancel()">取消</button>
          </div>
      </div>
    </div>
</template>

<style lang="css">
#editor_box {
  z-index: 11;
  height: 100%;
  width: 100%;
  position: fixed;
  top: 0px;
  bottom: 0px;
  left: 0px;
  right: 0px;
}
.editor_wapper {
  border-radius: 2px;
  overflow: hidden;
  zoom: 1;
  position: relative;
  width: 100%;
  max-width: 920px;
  box-shadow: #000 0px 0px 10px;
  background-color: rgb(240, 240, 240);
  margin: auto;
  margin-top: 45px;
  height: 84%;
  min-height: 400px;
  padding: 8px;
}
.editor_button {
  text-align: right;
}
.editor_button > button {
  margin-left: 8px;
  min-width: 60px;
  line-height: 16px;
}
@media (max-width: 992px) {
  .editor_wapper {
    border-radius: 0px;
    width: 100%;
    height: 100%;
    margin-top: 0px;
  }
}
</style>

<script>
export default {
  name: "editor_box",
  props: ["isDisplay", "saveCallback", "textareaContext", "editorFilename"],
  data() {
    return {
      // DisplaytextareaContext: this.textareaContext
    };
  },
  methods: {
    savetextareaContext() {
      this.saveCallback({
        filename: this.editorFilename,
        context: this.textareaContext
      });
      this.cancel();
    },
    cancel() {
      MCSERVER.pageIndexModel.editorDisplay = false;
    }
  }
};
</script>
