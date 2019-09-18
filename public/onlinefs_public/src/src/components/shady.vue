<template lang="html">
    <div id="shady_box" class="container" v-show="isDisplay">
        <!-- 黑幕 -->
    </div>
</template>

<style lang="css">
#shady_box {
  position: fixed;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  background-color: black;
  opacity: 0.62;
  width: 100%;
  z-index: 10;
}
</style>

<script>
const vmModel = {};

export default {
  name: "shady_box",
  props: ["isDisplay"],
  data() {
    return vmModel;
  },
  methods: {}
};
</script>
