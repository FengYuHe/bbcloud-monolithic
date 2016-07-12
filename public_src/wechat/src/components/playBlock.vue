<template lang="html">
  <div class="story-list">
    <div v-for="item in storylist" class="story-list-item">
          <span @click="toggleItem(item)">{{item.name}} <i v-link="{name:'yizi',params:{id:item.id}}"></i></span>
          <!-- 收藏、试听、推送列表 -->
          <ul v-show="currentItem === item && active" class="story-list-item-option">
              <li class="story-list-item-collection"><a>
                  收藏
              </a></li>
              <li class="story-list-item-audition"><a>
                  试听
              </a></li>
              <li class="story-list-item-demand"><a>
                  点播
              </a></li>
              <li class="story-list-item-push"><a>
                  推送
              </a></li>
          </ul>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    storylist: {
      type: Array,
      default () {
        return []
      }
    }
  },
  data: function () {
    return {
      currentItem: {},
      active: false
    }
  },
  computed: {},
  ready: function () {
    console.log('data from block:', this.storylist)
  },
  attached: function () {},
  methods: {
    toggleItem (item) {
      if (this.currentItem === item) {
        this.active = !this.active
      } else {
        this.active = true
        this.currentItem = item
      }
    }
  },
  components: {}
}
</script>

<style lang="css">
/* 底部列表 */
.story-list {
    margin:0px;
}

.story-list .story-list-item span  {
    display: block;
    padding: 9px 0;
    margin-top: 0px;
    margin-left: 26px;
    margin-right: 10px;
    margin-bottom: 0px;
    background-size: 8px;
    background-repeat: no-repeat;
    background-position: right;
    background-image: url("../assets/more_hd.png");
    border-bottom: 1px solid #F6F6F6;
}

.story-list li:last-child {
    border-bottom: none;
}

.story-list-item {
    font-size: 16px;
}

/*分类框*/
.story-list-item-option {
    width: 100%;
    padding:1px 0 0 0; /*分类框内边距*/
    margin: 0px;
    background-color: #666666;
    color: #F5FFE7;
    font-size: 14px;
}
.story-list-item-option li {
    display: inline-block;
    width: 18%;
    text-align: center;
    padding: 14% 0 10px;
    background-size: 37px;
    background-repeat: no-repeat;
    background-position: top;
    margin-left: 5%;

}

.story-list-item-option li a {
    margin: 15px 10px 0 10px;
}
.story-list-item-collection {
    margin-top:0px;
    background-image: url("../assets/logo.png");
    border-bottom: 0px;
}

.story-list-item-audition {
    margin-top:10px;
    background-image: url("../assets/logo.png");
    border-bottom: 0px;
}

.story-list-item-demand {
    margin-top:10px;
    background-image: url("../assets/logo.png");
    border-bottom: 0px;
}
.story-list-item-push {
    margin-top:10px;
    background-image: url("../assets/logo.png");
    border-bottom: 0px;
}
.story-list-item i{
  position: absolute;
  right: 5px;
  width: 30px;
  height: 30px;
}
</style>
