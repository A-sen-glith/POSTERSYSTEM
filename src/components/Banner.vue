<template>
    <div class="banner" :style="{ width: width + 'px', height: height + 'px' }">
      <Swipe type="card" class="swipe" :style="{width:width}" :autoplay="autoplay">
        <SwipeItem class="bannerImg" style="width: 100%;" v-for="(item, index) in bannerImages" :key="index">
          <a v-if="item.if_jump == 0" :href="item.jump_url" target="_blank" style="display: block; width: 100%; height: 100%; text-decoration: none; outline: none;">
              <img width="100%" v-lazy="item.pic_name" />
          </a>
          <div v-else style="display: block; width: 100%; height: 100%;">
              <img width="100%" v-lazy="item.pic_name" />
          </div>
        </SwipeItem>
      </Swipe>
  </div>
</template>

<script>
import Vue from 'vue'
import { Swipe, SwipeItem, Lazyload } from 'vant'
import { getAdvertising } from '@/api/user'
Vue.use(Lazyload)
const baseUrl = 'https://eposter.tri-think.cn/uploadFile'
export default {
  name: 'home',
  components: {
    Swipe,
    SwipeItem
  },
  data () {
    return {
      bannerImages: [],
      width: window.innerWidth,
      height: window.innerHeight,
      meeting_id: 0,
      autoplay: 3000
    }
  },
  computed: {},
  created () {
    const meeting_id = this.$route.query.meeting_id
    if (meeting_id) {
      this.meeting_id = Number(meeting_id)
    }
    getAdvertising({
      'page': 1, // 页码
      'pageSize': 20, // 每页记录数
      'type': 'banner', // 类型：广告，banner
      'memo': '', // 备注
      'status': '已开启', // 已开启（前台写死），已关闭
      'meeting_id': this.meeting_id, // 会议id
      'uid': 1
    }).then(res => {
      const { list } = res.data
      this.bannerImages = list || []
      this.autoplay = this.bannerImages[0].stay_duration * 1000
      this.bannerImages.forEach(item => {
        item.pic_name = baseUrl + '/' + item.pic_name
      })
    })
  },
  mounted () {
    window.addEventListener('resize', this.handResize)
    this.handResize()
  },
  methods: {
    handResize () {
      this.width = window.innerWidth
      this.height = window.innerHeight
      console.log('Resize:', this.width, this.height)
      if (this.width > this.height && this.width >= 768) {
        // this.width = Math.min(this.width,1024)
        this.height = this.height
        // this.width = this.height * (9 / 16)
        this.width = Math.min(window.innerWidth, 1070)
        console.log('电脑设备: 9:16比例', this.width, this.height)
      } else {
        this.height = window.innerHeight
        console.log('手机或平板: 全屏展示', this.width, this.height)
      }
    }
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handResize)
  }
}

</script>
<style lang="scss" scoped>
.banner{
    width: 100%;
    height: 100%;
    .swipe{
      width: 100%;
      height: 100%;
      .bannerImg {
        width: 100%;
        height: 100%;
        img {
          width: 100%;
          height: 100%;
          }
        }
      }
}
</style>
