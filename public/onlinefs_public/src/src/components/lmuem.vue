<template lang="html">
  <div class="letsgo">
    <div class="m-lmuem-items">
      <!-- 菜单列表项 数据源在下面 -->
      <div v-for="item in items" v-on:click="filesOperate(item)">
        <span v-if="item.title" class="m-lmuem-items-title">
          {{ item.name }}
        </span>
        <span v-else>
          <span v-bind:class="item.class" style="margin-right: 5px;"></span> {{ item.name }}
        </span>
      </div>
    </div>
    
  <!-- 文件上传的表单 -->
  <form id="m-upload-form" style="display:none;" method="post" enctype="multipart/form-data" action="/fs/upload">
    <input type="file" name="upload_file" id="m-upload-file" v-on:change="formSub" />
  </form>
  </div>
</template>

<style lang="css">
/* .m-lmuem-items {} */

.m-lmuem-items div {
  width: 100%;
  color: #777;
  text-align: left;
  padding: 6px 0px 6px 14px;
  margin: 0;
  border-bottom: 1px solid #dcdcdc;
  cursor: pointer;
}

.m-lmuem-items div:hover {
  background-color: #fbfbfb;
}

.m-lmuem-items-title {
  font-size: 16px;
  color: black;
  padding-top: 3px;
  padding-bottom: 3px;
  display: block;
}
</style>

<script>
// import ajaxMoudule from "../module/ajax";
import functionMudule from "../module/function";
import tools from "../module/tools";

export default {
  name: "lmuem",
  props: ["filesHub"],
  methods: {
    formSub(e) {
      this.allowUpload = false;
      let file = $("#m-upload-file")[0].files[0];
      functionMudule
        .upload(file, status => {
          this.items[2].name = "正在上传.." + status + "%";
          this.items[2].class = this.items[2].class + " color-green";
          console.log(this.items[2].name);
        })
        .then(
          status => {
            this.items[2].name = "上传完毕！";
            location.reload();
          },
          (XML, textStatus, errorThrown) => {
            tools.popWindow("错误，文件上传失败！\n" + errorThrown);
          }
        );
    },
    filesOperate(item) {
      //文件栈开始操作
      let stack = this.getFileStack();
      console.log(stack);
      if (item.title) return;

      switch (item.name) {
        case "刷新":
          location.reload();
          break;
        case "上传文件":
          if (this.allowUpload) $("#m-upload-file").click();
          else tools.popWindow("当前再禁止上传文件，请点击刷新即可再次上传。");
          break;
        case "复制":
          functionMudule.copy(this.getFileStack());
          tools.popWindow("已复制到临时区域,使用粘贴即可复制到当前目录");
          break;
        case "剪贴":
          functionMudule.cponce(this.getFileStack());
          tools.popWindow("已复制到临时区域,使用粘贴即可移动到当前目录");
          break;
        case "粘贴":
          //BUG Note 刷新必须写在then中
          functionMudule.paste().then(() => location.reload());
          break;
        case "删除":
          let filestack = this.getFileStack(); //BUG Note:this 上下文不可出现在异步
          tools.confirm("您确定要删除这(些)文件吗?", () => {
            functionMudule.remove(filestack).then(() => location.reload());
          });
          break;
        case "重命名":
          if (this.getFileStack().length != 1) {
            tools.popWindow("非法操作，不能同时重命名多个文件或未选择文件");
            break;
          }
          let stack = this.getFileStack();
          tools.prompt("重命名", newName => {
            functionMudule.rename(stack, newName).then(() => location.reload());
          });
          break;
        case "新建目录":
          tools.prompt("新的目录名", newDirName => {
            functionMudule.mkdir(newDirName).then(() => location.reload());
          });
          break;
        case "退出":
          window.location.href = "/fs_auth/logout";
          break;
        case "使用提示":
          functionMudule.userInfo();
          break;
        case "压缩目录":
          if (this.getFileStack().length != 1) {
            tools.popWindow("不可解压空文件或同时解压多个文件！", "非法操作");
            break;
          }
          functionMudule.compress(this.getFileStack()).then(() => {});
          break;
        case "解压 ZIP":
          if (this.getFileStack().length != 1) {
            tools.popWindow("不可解压空文件或同时解压多个文件！", "非法操作");
            break;
          }
          functionMudule.extractZip(this.getFileStack()).then(() => {});
          break;
        case "编辑文件":
          if (this.getFileStack().length != 1) {
            tools.popWindow("不可编辑空文件或同时编辑多个文件！", "非法操作");
            break;
          }
          functionMudule.editFile(this.getFileStack());
          break;
        default:
          console.error("--------------- 选择操作未执行 ---------------");
          break;
      }
      // this.filesHub.set("CompFiles", []); //Line: bug
    },
    getFileStack() {
      let stack = this.filesHub.get("CompFiles", []);
      return stack;
    }
  },
  data() {
    let that = this;
    return {
      allowUpload: true,
      items: [
        {
          //如果您修改了这里的名字，请将上面的名字也修改
          //我们是通过名字来进行监控单击事件的
          name: "基本功能", //项目名
          class: "", //图标 Class
          api: "", //保留，暂无使用，请求的 API
          title: true //是否为大标题
        },
        {
          name: "刷新",
          class: "glyphicon glyphicon-refresh",
          api: ""
        },
        {
          name: "上传文件", //此项目顺序不可改变，必须第三项
          class: "glyphicon glyphicon-open",
          api: "",
          upload: true
        },
        {
          name: "文件操作",
          class: "",
          api: "",
          title: true
        },
        {
          name: "新建目录",
          class: "glyphicon glyphicon-plus",
          api: ""
        },
        {
          name: "编辑文件",
          class: "glyphicon glyphicon-pencil",
          api: ""
        },
        {
          name: "压缩目录",
          class: "glyphicon glyphicon-briefcase",
          api: ""
        },
        {
          name: "解压 ZIP",
          class: "glyphicon glyphicon-level-up",
          api: ""
        },
        {
          name: "重命名",
          class: "glyphicon glyphicon-credit-card",
          api: ""
        },
        {
          name: "复制",
          class: "glyphicon glyphicon-duplicate",
          api: ""
        },
        {
          name: "剪贴",
          class: "glyphicon glyphicon-scissors",
          api: ""
        },
        {
          name: "粘贴",
          class: "glyphicon glyphicon-paste",
          api: ""
        },
        {
          name: "删除",
          class: "glyphicon glyphicon-trash",
          api: ""
        },
        {
          name: "用户操作",
          class: "",
          api: "",
          title: true
        },
        {
          name: "使用提示",
          class: "glyphicon glyphicon-asterisk",
          api: ""
        },
        {
          name: "退出",
          class: "glyphicon glyphicon-log-out",
          api: ""
        }
      ]
    };
  }
};
</script>