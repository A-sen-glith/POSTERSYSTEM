<template>
  <div class="container">
    <!-- 广告层 -->
    <div style="
          position: fixed;
          background-color: #f5f5f5;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        " v-if="showAdvert && advertImages.length > 0">
      <div class="advert" :style="{
          width: widthBanner + 'px',
          marginLeft: '50%',
          transform: 'translate(-50%)',
        }">
        <Swipe type="mask" class="swipe" :autoplay="autoplay">
          <SwipeItem class="advertisingImg" v-for="(item, index) in advertImages" :key="index">
            <a v-if="item.if_jump === 0" :href="item.jump_url" target="_blank" style="text-decoration: none; outline: none;height: 100%;">
              <img :src="item.pic_name" />
            </a>
            <div v-else style="text-decoration: none; outline: none;height: 100%;">
              <img :src="item.pic_name" />
            </div>
          </SwipeItem>
        </Swipe>
        <div class="advertSwitch" @click="goBack">
          {{ $t("closeen") }}
        </div>
      </div>
    </div>
    
    <!-- 正常内容区 -->
    <div class="detailsPage" :style="{ width: width + 'px', height: height + 'px' }" v-if="!showAdvert || advertImages.length === 0">
      <!-- <div class="backBtn" @click="goBack">
        <Icon name="arrow-left" />{{ $t("back") }}
      </div> -->
      <div class="backBtn" @click="goBack">{{ $t("backen") }}</div>
      <div class="content-wrapper">

        <div class="tips">{{ $t("tipsen") }}
          <Icon name="expand-o" />
        </div>
        <div class="imgItem" v-for="item in detailImages" :key="item.id">
          <img style="width: 100%;" v-lazy="item.pic_name" alt="">
        </div>
        <div class="copyright">Copyright @ 2018-2025 TRI-THINK All Rights Reserved.</div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import { Icon, Lazyload, Swipe, SwipeItem, Toast } from 'vant'
import VueTouch from 'vue-touch'
import { wxShare } from '@/utils/index'
import {
  getMeetingList,
  getAdvertising
} from '@/api/user'
// import { getAdvertising } from "@/api/user"
// import Banner from "components/Banner"
Vue.use(Lazyload)
Vue.use(Toast)
Vue.use(VueTouch, { name: 'v-touch' })
const baseUrl = 'https://eposter.tri-think.cn/uploadFile'
export default {
  name: 'details',
  components: {
    // Banner,
    Icon,
    Swipe,
    SwipeItem
  },
  data () {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      widthBanner: window.innerWidth, // 广告宽度
      bannerHeight: 0,
      detailImages: [],
      itemData: this.$route.params.data,
      // 广告相关数据
      advertImages: [],
      showAdvert: false,
      autoplay: 3000, // 轮播间隔时间，默认3秒
      inactivityTimeout: [], // 不活动计时器数组
      inactivityDelay: 60, // 不活动时间（秒），默认为60秒
      isAdFeatureEnabled: true, // 广告功能是否开启
      // 缩放相关
      scale: 1,
      minScale: 1,
      maxScale: 3,
      lastScale: 1,
      // 平移相关
      panX: 0,
      panY: 0,
      lastPanX: 0,
      lastPanY: 0,
      isPanning: false
    }
  },
  computed: {
    contentStyle () {
      return {
        transform: `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`,
        transformOrigin: 'center center',
        transition: this.isPanning ? 'none' : 'transform 0.3s ease'
      }
    }
  },
  created () {
    document.title = 'eposter'
    console.log('获取banner信息成功', this.itemData, this.$route.params.data)
    this.updateDetailData()
    
    // 获取会议信息和广告信息
    if (this.itemData && this.itemData.meeting_id) {
      this.fetchAdvertisingData(this.itemData.meeting_id)
    }
  },
  mounted () {
    // 清除可能存在的所有定时器
    for (let i = 0; i < 10000; i++) {
      clearTimeout(i)
    }
    
    window.addEventListener('resize', this.handResize)
    // 添加用户交互监听，用于重置不活动计时器
    window.addEventListener('keydown', this.resetTimer)
    window.addEventListener('mousemove', this.resetTimer)
    window.addEventListener('touchstart', this.resetTimer)
    window.addEventListener('touchmove', this.resetTimer)
    
    // 添加对.container元素滚动的监听
    this.$nextTick(() => {
      const container = document.querySelector('.container')
      if (container) {
        container.addEventListener('scroll', this.resetTimer)
      }
    })
    
    this.handResize()

    // 添加双击缩放事件
    if (this.$refs.zoomContainer && this.$refs.zoomContainer.$el) {
      this.$refs.zoomContainer.$el.addEventListener('dblclick', this.handleDoubleClick)
    }

    // 添加鼠标滚轮缩放
    if (this.$refs.zoomContainer && this.$refs.zoomContainer.$el) {
      this.$refs.zoomContainer.$el.addEventListener('wheel', this.handleWheel, { passive: false })
    }
  },
  methods: {
    wxShare,
    // 获取广告数据
    fetchAdvertisingData(meeting_id) {
      getMeetingList({
        id: undefined,
        meeting_name: '', // 会议名称
        address: '', // 地点
        username: '', // 用户名（登录类型为会议，需要传这个）
        customerid: 0,
        type: '管理员',
        page: 1, // 会议id，必填
        pageSize: 1000, // 搜索框内容
        uid: 1
      }).then((res) => {
        const { list } = res.data
        const meet = list.find((item) => item.id == meeting_id)
        if (meet && meet.ad_status === '已关闭') {
          console.log('广告功能已关闭')
          this.isAdFeatureEnabled = false
        } else {
          this.isAdFeatureEnabled = true
          // 获取广告数据
          this.getAdvertisingData(meeting_id)
        }
      })
    },
    
    // 获取广告图片数据
    getAdvertisingData(meeting_id) {
      getAdvertising({
        page: 1, // 页码
        pageSize: 20, // 每页记录数
        type: '广告', // 类型：广告，banner
        memo: '', // 备注
        status: '已开启', // 已开启（前台写死），已关闭
        meeting_id: meeting_id, // 会议id
        uid: 1
      })
        .then((res) => {
          const { list } = res.data
          this.advertImages = list || []
          this.advertImages.forEach((item) => {
            item.pic_name = baseUrl + '/' + item.pic_name
          })
          if (this.advertImages.length > 0) {
            this.autoplay = this.advertImages[0].stay_duration * 1000
            // 启动不活动监控
            this.resetTimer()
          }
          console.log('获取广告信息成功')
        })
        .catch((err) => {
          console.log('获取广告信息失败', err)
        })
    },
    
    // 重置不活动计时器
    resetTimer() {
      // 清除已有的计时器
      if (this.inactivityTimeout) {
        for (let i = 0; i < this.inactivityTimeout.length; i++) {
          clearTimeout(this.inactivityTimeout[i])
        }
      }
      // 如果广告功能已启用且有广告内容，则重新开始监控
      if (this.isAdFeatureEnabled && this.advertImages.length > 0) {
        this.inactivityDelay = this.itemData.lockDuration
        this.monitorInactivity()
      }
    },
    
    // 监控用户不活动
    monitorInactivity() {
      if (this.inactivityDelay > 0 && this.isAdFeatureEnabled && this.advertImages.length > 0) {
        console.log('启动不活动监控，倒计时', this.inactivityDelay, '秒')
        
        // 清除已有的计时器
        if (this.inactivityTimeout) {
          for (let i = 0; i < this.inactivityTimeout.length; i++) {
            clearTimeout(this.inactivityTimeout[i])
          }
        }

        // 设置新的计时器
        let timer = setTimeout(() => {
          console.log('用户不活动时间达到阈值，显示广告')
          Toast.clear()
          this.showAdvert = true
        }, this.inactivityDelay * 1000)
        
        this.inactivityTimeout.push(timer)
        console.log('不活动监控计时器已启动')
      }
    },
    updateDetailData () {
      this.itemData = this.$route.params.data
      getMeetingList({
        id: undefined,
        meeting_name: '', // 会议名称
        address: '', // 地点
        username: '', // 用户名（登录类型为会议，需要传这个）
        customerid: 0,
        type: '管理员',
        page: 1, // 会议id，必填
        pageSize: 1000, // 搜索框内容
        uid: 1
      }).then((res) => {
        const { list } = res.data
        const meet = list.find((item) => item.id == this.itemData.meeting_id)
        this.wxShare(meet, sessionStorage.getItem('pageHref'))
      })
      if (!this.itemData) {
        console.error('没有传递有效的 itemData')
        return
      }
      const { pic_list } = this.itemData
      this.detailImages = pic_list
      this.detailImages.forEach(item => {
        item.pic_name = item.pic_name.indexOf('http') !== -1 ? item.pic_name : baseUrl + '/' + item.pic_name
        // item.pic_name = baseUrl + '/' + item.pic_name
      })
      console.log('this.detailImages=====', this.detailImages)
    },
    handResize () {
      this.width = window.innerWidth
      this.height = window.innerHeight
      console.log('Resize:', this.width, this.height)
      if (this.width > this.height && this.width >= 768) {
        // 电脑设备，限制最大宽度，允许内容自然延展
        this.width = Math.min(window.innerWidth, 1070)
        this.widthBanner = this.height * (9 / 16)
        // this.height = this.height
        console.log('电脑设备: 允许内容自然延展', this.width, this.height)
      } else {
        this.height = window.innerHeight
        console.log('手机或平板: 全屏展示', this.width, this.height)
      }

      // 重置缩放和平移
      this.resetZoomAndPan()
    },
    goBack () {
      this.showAdvert = false
      // 返回上一页并传递参数
      if (this.$route.params.data) {
        this.$router.push({
          path: '/',
          query: {
            meeting_id: this.$route.params.data.meeting_id,
            fromDetail: 'true'
          }
        })
      } else {
        this.$router.go(-1)
      }
    },
    // 缩放相关方法
    onPinchStart () {
      this.lastScale = this.scale
    },
    onPinch (e) {
      // 计算新的缩放值
      let newScale = this.lastScale * e.scale

      // 限制缩放范围
      newScale = Math.max(this.minScale, Math.min(newScale, this.maxScale))

      this.scale = newScale
    },
    onPinchEnd () {
      // 如果缩放小于最小值，重置为最小值
      if (this.scale < this.minScale) {
        this.scale = this.minScale
      }

      // 如果缩放回到原始大小，重置平移
      if (this.scale === this.minScale) {
        this.panX = 0
        this.panY = 0
      }
    },
    // 平移相关方法
    onPanStart () {
      this.isPanning = true
      this.lastPanX = this.panX
      this.lastPanY = this.panY
    },
    onPan (e) {
      // 只有在放大状态下才允许平移
      if (this.scale > this.minScale) {
        // 计算新的平移值
        this.panX = this.lastPanX + e.deltaX
        this.panY = this.lastPanY + e.deltaY
      }
    },
    onPanEnd () {
      this.isPanning = false

      // 限制平移范围，防止内容被拖出视图太远
      const maxPanX = (this.scale - 1) * this.width / 2
      const maxPanY = (this.scale - 1) * this.height / 2

      this.panX = Math.max(-maxPanX, Math.min(this.panX, maxPanX))
      this.panY = Math.max(-maxPanY, Math.min(this.panY, maxPanY))

      // 如果缩放回到原始大小，重置平移
      if (this.scale === this.minScale) {
        this.panX = 0
        this.panY = 0
      }
    },
    // 双击缩放
    handleDoubleClick (e) {
      e.preventDefault()

      if (this.scale > this.minScale) {
        // 如果已经放大，双击恢复原始大小
        this.resetZoomAndPan()
      } else {
        // 如果是原始大小，双击放大到2倍
        this.scale = 2

        // 计算点击位置为缩放中心
        const rect = this.$refs.zoomContainer.$el.getBoundingClientRect()
        const offsetX = e.clientX - rect.left
        const offsetY = e.clientY - rect.top

        // 调整平移以使点击位置成为缩放中心
        this.panX = (this.width / 2 - offsetX) * (this.scale - 1)
        this.panY = (this.height / 2 - offsetY) * (this.scale - 1)
      }
    },
    // 鼠标滚轮缩放
    handleWheel (e) {
      // 阻止默认滚动行为，允许缩放
      if (e.ctrlKey) {
        e.preventDefault()

        // 计算缩放步长
        const delta = e.deltaY || e.detail || e.wheelDelta
        let newScale = this.scale

        if (delta < 0) {
          // 向上滚动，缩放
          newScale = this.scale * 1.1
        } else {
          // 向下滚动，缩小
          newScale = this.scale / 1.1
        }

        // 限制缩放范围
        newScale = Math.max(this.minScale, Math.min(newScale, this.maxScale))

        // 计算鼠标位置为缩放中心
        const rect = this.$refs.zoomContainer.$el.getBoundingClientRect()
        const offsetX = e.clientX - rect.left
        const offsetY = e.clientY - rect.top

        // 计算新的平移值，使鼠标位置成为缩放中心
        if (newScale !== this.scale) {
          const scaleRatio = newScale / this.scale
          const newPanX = offsetX - (offsetX - this.panX) * scaleRatio
          const newPanY = offsetY - (offsetY - this.panY) * scaleRatio

          this.scale = newScale
          this.panX = newPanX
          this.panY = newPanY

          // 如果缩放回到原始大小，重置平移
          if (this.scale === this.minScale) {
            this.panX = 0
            this.panY = 0
          }
        }
      }
      // 允许默认滚动行为，滚动页面
    },
    // 重置缩放和平移
    resetZoomAndPan () {
      this.scale = this.minScale
      this.panX = 0
      this.panY = 0
    }
  },
  watch: {
    // 监听路由参数变化
    '$route': {
      handler (to, from) {
        this.showAdvert = false
        document.title = 'eposter'
        if (to.name === 'detailsEn' && to.params.data) {
          console.log('路由参数变化，更新数据', to.params.data)
          this.updateDetailData()
          // 重置缩放和平移状态
          this.resetZoomAndPan()
        }
      },
      deep: true
    }
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handResize)
    
    // 移除不活动监控的事件监听器
    window.removeEventListener('keydown', this.resetTimer)
    window.removeEventListener('mousemove', this.resetTimer)
    window.removeEventListener('touchstart', this.resetTimer)
    window.removeEventListener('touchmove', this.resetTimer)
    
    // 移除滚动事件监听器
    const container = document.querySelector('.container')
    if (container) {
      container.removeEventListener('scroll', this.resetTimer)
    }
    
    // 清除所有定时器
    if (this.inactivityTimeout) {
      for (let i = 0; i < this.inactivityTimeout.length; i++) {
        clearTimeout(this.inactivityTimeout[i])
      }
    }

    // 移除缩放相关事件监听器
    if (this.$refs.zoomContainer && this.$refs.zoomContainer.$el) {
      this.$refs.zoomContainer.$el.removeEventListener('dblclick', this.handleDoubleClick)
      this.$refs.zoomContainer.$el.removeEventListener('wheel', this.handleWheel)
    }
  }
}

</script>
<style lang="scss" scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  // height: 100vh;
  width: 100vw;
  background-color: #fff;
  position: relative;
  .advert {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 99;

      .swipe {
        width: 100%;
        height: 100%;
        z-index: 8;

        .advertisingImg {
          img {
            width: 100%;
            height: 100%;
            z-index: 99;
          }
        }
      }

      .advertSwitch {
        position: absolute;
        top: 7px;
        right: 7px;
        // width: 43px;
        // height: 14px;
        padding: 12px 20px;
        font-size: 12px;
        line-height: 14px;
        text-align: center;
        color: #fff;
        background-color: rgba(0, 0, 0, 0.8);
        border-radius: 3px;
        z-index: 9;
      }
    }

  .detailsPage {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;

    .backBtn {
      position: absolute;
      top: 10px;
      left: 10px;
      color: #3182bd;
      cursor: pointer;
      font-size: 14px;
      z-index: 100;
      display: flex;
      align-items: center;
    }

    .content-wrapper {
      height: 100%;
      width: 100%;
      overflow: auto;
      /* 允许内容溢出时滚动 */
      box-sizing: border-box;
      position: relative;
      /* 添加相对定位 */

      /* 隐藏滚动条但保留滚动功能 */
      &::-webkit-scrollbar {
        width: 0;
        height: 0;
        display: none;
      }

      scrollbar-width: none;
      /* Firefox */
      -ms-overflow-style: none;
      /* IE and Edge */

      .content {
        width: 100%;
        /* 移除固定高度，允许内容自然延展 */
        touch-action: pan-y pinch-zoom;
        /* 允许垂直滚动和缩放 */
        will-change: transform;
        /* 优化性能 */

        .imgItem {
          width: 100%;

          img {
            width: 100%;
            vertical-align: bottom;
          }
        }
      }
    }

    .content-wrapper .content .imgItem:nth-child(2) {
      width: 100%;
      margin-top: -1px;
    }
  }

  .tips {
    color: red;
    text-align: right;
    padding: 10px;
    position: sticky;
    top: 0;
    background-color: rgba(255, 255, 255, 0.8);
    z-index: 10;
  }

  .copyright {
    margin-top: 10px;
    font-size: 12px;
    text-align: center;
    color: #333;
    padding-bottom: 20px;
  }
}
</style>
