import Vue from "vue";
// import componentLmuem from './components/lmuem';
// import componentFiles from './components/files';

// import hubModule from "./module/hub";

import VueApp from "./page_index.vue";

Vue.config.productionTip = true;

new Vue({
  render: (h) => h(VueApp),
}).$mount("#app");

// const filesHub = hubModule.Hub;

// new Vue({
//     el: "#vm-leftm-items",
//     data: {
//         filesHub: filesHub,
//     },
//     components: {
//         componentLmuem,
//     }
// });

// import funcModule from "./module/function";

// const vm_files_items = new Vue({
//     el: "#vm-files-items",
//     components: {
//         componentFiles,
//     },
//     data: {
//         commonHub: filesHub,
//         filesCollect: []
//     }
// });

// funcModule.ls().then(function name(data) {
//     vm_files_items.$data.filesCollect = data;
// });
