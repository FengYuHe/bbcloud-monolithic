<template>
  <div id="app">
    <!-- main view -->
    <router-view
      class="view"
      keep-alive
      transition
      style="margin-bottom:50px"
      transition-mode="out-in">
    </router-view>
    <tabbar style="position:fixed;bottom:0">
      <!--use v-link-->
      <tabbar-item v-link="{path:'/collection'}">
        <img slot="icon" src="./assets/icon_nav_button.png">
        <span slot="label">收藏</span>
      </tabbar-item>
      <!--use http link-->
      <tabbar-item show-dot link="/history">
        <img slot="icon" src="./assets/icon_nav_msg.png">
        <span slot="label">历史</span>
      </tabbar-item>
      <!--use vue-router link-->
      <tabbar-item link="/song-list">
        <img slot="icon" src="./assets/icon_nav_article.png">
        <span slot="label">歌单</span>
      </tabbar-item>
    </tabbar>
  </div>
</template>

<script>
import Tabbar from 'vux/dist/components/tabbar'
import TabbarItem from 'vux/dist/components/tabbar-item'
// import $ from 'webpack-zepto'
export default {
  ready () {
    // console.log('height is:::', $(document).height())
    // window.alert(window.localStorage.getItem('token'))
  },
  components: {
    Tabbar,
    TabbarItem
  }
}
</script>
<style>
@import '~vux/dist/vux.css';
</style>
