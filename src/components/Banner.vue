<template>
  <div class="banner" :style="{ width: width + 'px', height: height + 'px' }">
    <Swipe type="card" class="swipe" :style="{ width: width }" :autoplay="autoplay" v-if="bannerImages.length > 0">
      <SwipeItem class="bannerImg" style="width: 100%;" v-for="(item, index) in bannerImages" :key="index">
        <a v-if="item.if_jump === 0" :href="item.jump_url" target="_blank"
          style="display: block; width: 100%; height: 100%; text-decoration: none; outline: none;">
          <img width="100%" v-lazy="item.pic_name" style="object-fit: cover; width: 100%; height: 100%;" />
        </a>
        <div v-else style="display: block; width: 100%; height: 100%;">
          <img v-lazy="item.pic_name" style="object-fit: cover; width: 100%; height: 100%;" />
        </div>
      </SwipeItem>
    </Swipe>
  </div>
</template>

<script>
import Vue from 'vue'
import { Swipe, SwipeItem, Lazyload } from 'vant'
// import { getAdvertising } from "@/api/user"
Vue.use(Lazyload)
const baseUrl = 'https://eposter.tri-think.cn/uploadFile'
export default {
  name: 'home',
  props: {
    meetingId: {
      type: Number
    },
    bannerData: {
      type: Object,
      required: true
    }
  },
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
  watch: {
    bannerData (newVal) {
      if (newVal && newVal.list) {
        console.log('banner Data updated:', newVal.list)
        // 处理 bannerImages 更新等操作
        this.bannerImages = newVal.list.map(item => {
          item.pic_name = item.pic_name.startsWith('https://') ? item.pic_name : baseUrl + '/' + item.pic_name
          return item
        })
        this.autoplay = this.bannerImages[0].stay_duration * 1000
        console.log('banner Images 11:', this.bannerImages)
      }
    }
  },
  created () {
    console.log('Banner created====', this.meetingId)
    console.log('Banner bannerData====', this.bannerData)
  },
  mounted () {
    this.$nextTick(() => {
      console.log('bannerImages rendered', this.bannerData.list)
      if (this.bannerData && this.bannerData.list && Array.isArray(this.bannerData.list)) {
        console.log('bannerImages rendered', this.bannerData.list)
        this.bannerImages = this.bannerData.list.map(item => {
          item.pic_name = item.pic_name.startsWith('https://') ? item.pic_name : baseUrl + '/' + item.pic_name
          return item
        })
        this.autoplay = this.bannerImages[0].stay_duration * 1000
        console.log('banner Images 11:', this.bannerImages) // 在这里打印确保是最新的
      } else {
        console.error('bannerData or bannerData.list is not available')
      }
    })
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
.banner {
  width: 100%;
  height: 100%;

  .swipe {
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
