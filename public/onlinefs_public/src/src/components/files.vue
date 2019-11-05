<template lang="html">
  <div class="m-files-panel">
    <!--表头-->
    <table class="m-table" width="100%">
      <tr height="52px">
        <th width="4%" style="">
          <input type="checkbox" v-model="checkboxAll">
        </th>
         <th width="2%"></th>
        <th width="44%">文件名</th>
        <th width="10%">类型</th>
        <th width="15%">大小</th>
        <th class="m-phone-none" width="35%">创建时间</th>
      </tr>
      <tr>
        <td>
          <input type="checkbox" aria-checked="false" value="on" disabled="disabled">
        </td>
        
        <td> <span  class="glyphicon glyphicon-folder-open"></span></td>
        <td style="color: blue;cursor: pointer;">
          <a class="m-item-file-a-dir" href="javascript:void(0);" v-on:click="cduplevel">上级目录</a>
        </td>
        <td>上级</td>
        <td></td>
        <td class="m-phone-none"></td>
      </tr>
      <tr v-for="item in fileList">
        <td v-on:click="fileSelectedEvent(item)">
          <input type="checkbox" v-model="item.checkbox">
        </td>
        <td class="m-td-file-logo">
          <span v-if="!item.isFile" class="glyphicon glyphicon-folder-open"></span>
          <span v-else class="glyphicon glyphicon-file"></span>
        </td>
        <td>
          <a v-if="!item.isFile" class="m-item-file-a-dir" href="javascript:void(0);" v-html="enContext(item.name)" v-on:click="cd(item)"></a>
          <a v-else target="_black" class="m-item-file-a-file" :href="getDownloadURL(item)" v-html="enContext(item.name)" v-on:click="cd(item)"></a>
        </td>
        <td v-if="item.isFile">文件</td>
        <td v-else>目录</td>
        <td v-text="sizecomp(item,item.size)"></td>
        <td class="m-phone-none" v-text="item.time"></td>
      </tr>
    </table>


  </div>
</template>

<style lang="css">
.m-files-panel {
  /*padding: 0 8px;*/
  overflow: hidden;
}

.m-table th {
  background-color: #ececec;
}

.m-table th,
.m-table td {
  padding: 8px;
  border-bottom: 1px solid #dcdcdc;
}

.m-table td {
  padding: 4px 8px;
}

.m-table tr:hover {
  background-color: #d4d4d4;
}

.m-item-file-a-dir {
  color: #161616;
  display: inline-block;
  width: 100%;
}

.m-item-file-a-file {
  color: #161616;
  display: inline-block;
  width: 100%;
}

.m-td-file-logo {
  padding: 4px 0px;
  text-align: right;
  color: #464646;
}
</style>

<script>
import hubMoudle from "../module/hub";
import functionModule from "../module/function";
import tools from "../module/tools";

const vmModel = {
  checkboxAll: false,
  selectedStack: [],
  fileList: []
};

functionModule.ls().then(data => {
  vmModel.fileList = data;
});

export default {
  props: ["commonHub"],
  data() {
    return vmModel;
  },
  methods: {
    getDownloadURL(item) {
      return (
        window.MCSERVER.URL("fs/download/") + encodeURIComponent(item.name)
      );
    },
    enContext(text) {
      return tools.encodeContext(text);
    },
    sizecomp(item, size) {
      //初始单位字节
      let res = 0;
      if (!item.isFile) return "";
      if (size < 0) return "特殊";
      if (size <= 1024) return size.toFixed(1) + " B";
      if ((res = size / 1024) <= 1024) return res.toFixed(1) + " KB";
      if ((res = size / 1024 / 1024) <= 1024) return res.toFixed(1) + " MB";
      if ((res = size / 1024 / 1024 / 1024) <= 1024)
        return res.toFixed(1) + " GB";
    },
    //文件选择事件
    fileSelectedEvent(item) {
      if (item) item.checkbox = !item.checkbox;
      this.reloadStack();
    },
    //刷新提交栈
    reloadStack() {
      let selectedStack = [];
      for (let v of this.fileList) {
        if (v.checkbox) selectedStack.push(v);
      }
      this.commonHub.set("CompFiles", selectedStack);
    },
    resetStack(vool) {
      for (let v of this.fileList) v.checkbox = vool;
      this.reloadStack();
    },
    cd(item) {
      let that = this;
      if (item.isFile) {
        //下载此文件
      } else {
        //进入目录 并 刷新文件栈
        this.commonHub.set("CompFiles", []);
        this.checkboxAll = false;
        functionModule.ls(item.name).then(data => {
          that.fileList = data;
        });
      }
    },
    cduplevel() {
      this.checkboxAll = false;
      let that = this;
      functionModule.ls("../").then(data => {
        that.fileList = data;
      });
      this.commonHub.set("CompFiles", []);
    }
  },
  watch: {
    checkboxAll() {
      for (let v of this.fileList) {
        v.checkbox = this.checkboxAll;
      }
      this.reloadStack();
      return this.checkboxAll;
    }
  }
};
</script>