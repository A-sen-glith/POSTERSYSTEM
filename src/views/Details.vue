<template>
  <div class="main" :style="{ width: width + 'px' }" style="margin: 0 auto">
    <Banner :meetingId="meetingId" v-show="poster_banner_status" :bannerData="bannerData"
      :style="{ width: '100%', height: calculatedHeight + 'px' }" />
    <div class="container">
      <div class="detailsPage" :style="{ width: width + 'px' }">
        <div class="header">
          <div class="backBtn" @click="goBack"><i
              style="font-size: 22px;margin-left: -15px;margin-right: 3px;margin-top: 3px;"
              class="el-icon-arrow-left"></i> {{ $t("back") }}</div>
              <div class="backBtn" style="margin-right: auto;margin-left: 20px;" @click="likeFun" v-show="like_status && !liked" ><img style="width: 24px; height: 24px;margin-right: 5px;" src="@/assets/like.png" alt="">{{ $t("like") }}</div>
              <div class="backBtn" style="background:#db8a10;color: #fff;margin-right: auto;margin-left: 20px;" v-show="like_status&& liked" ><img style="width: 24px; height: 24px;margin-right: 5px;" src="@/assets/like1.png" alt="">{{ $t("like") }}</div>
              <div class="tips" >{{ $t("tips") }}</div>
        </div>
        <div class="content-wrapper">
          <div class="imgItem" v-for="item in detailImages" :key="item.id">
            <div class="image-container" :style="{ position: 'relative'}">
              <img v-lazy="item.pic_name" alt="" @dblclick="toggleImageSize(item)" @touchstart="touchStart($event, item)"
                @touchmove="touchMove($event, item)" @touchend="touchEnd($event, item)"
                :style="{ width: item.zoomed ? '200%' : '100%' }">
              <div v-if="watermark" class="watermark-overlay" :style="{
                position: 'absolute',
                top: 0,
                left: 0,
                width: item.zoomed ? '200%' : '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 10,
                opacity: 0.3,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
              }">
                <div :style="{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  display: 'flex',
                  flexWrap: 'wrap',
                  pointerEvents: 'none'
                }">
                  <span v-for="n in 200" :key="n" :style="{
                    padding: '20px',
                    fontSize: '18px',
                    color: 'rgba(0, 0, 0, 0.7)',
                    whiteSpace: 'nowrap',
                    transform: 'rotate(-30deg)',
                    pointerEvents: 'none'
                  }">{{ watermark }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="copyright">Copyright @ 2018-2025 TRI-THINK All Rights Reserved.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import { Icon, Lazyload } from 'vant'
import VueTouch from 'vue-touch'
import Banner from 'components/Banner'
import { getAdvertising, getPosterLikeAdd } from '@/api/user'
// import Banner from "components/Banner"
Vue.use(Lazyload)
Vue.use(VueTouch, { name: 'v-touch' })
const baseUrl = 'https://eposter.tri-think.cn/uploadFile'
export default {
  name: 'details',
  components: {
    Banner,
    Icon
  },
  data() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      bannerHeight: 0,
      detailImages: [],
      itemData: this.$route.params.data,
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
      isPanning: false,
      calculatedHeight: 0,
      meetingId: 0,
      bannerData: {list: []},
      initialPinchDistance: 0,
      lastZoomState: false,
      poster_banner_status: false,
      like_status: false,
      watermark: '',
      liked: false,
    }
  },
  computed: {
    contentStyle() {
      return {
        transform: `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`,
        transformOrigin: 'center center',
        transition: this.isPanning ? 'none' : 'transform 0.3s ease'
      }
    }
  },
  created() {
    document.title = '壁报展示'
    console.log('获取banner信息成功', this.itemData, this.$route.params.data)
    // this.meetingId = this.$route.params.data.meeting_id
    if (this.$route.params.data && this.$route.params.data.meeting_id) {
      this.meetingId = this.$route.params.data.meeting_id
    }
    
    this.updateDetailData()
  },
  mounted() {
    getAdvertising({
      'page': 1, // 页码
      'pageSize': 20, // 每页记录数
      'type': 'banner', // 类型：广告，banner
      'memo': '', // 备注
      'status': '已开启', // 已开启（前台写死），已关闭
      'meeting_id': this.meetingId, // 会议id
      'uid': 1
    }).then(res => {
      this.bannerData = res.data || {list: []}
      console.log(this.bannerData, 'banner this.imageList')
    })
    this.poster_banner_status = this.$route.params.poster_banner_status
    this.like_status = this.$route.params.like_status
    this.watermark = this.$route.params.watermark
    window.addEventListener('resize', this.handResize)
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
    likeFun() {
      getPosterLikeAdd({
        "id": 2
      }).then(res => {
        this.liked = !this.liked
      })
    },
    updateDetailData() {
      this.itemData = this.$route.params.data
      if (!this.itemData) {
        console.error('没有传递有效的 itemData')
        return
      }
      const { pic_list } = this.itemData
      this.detailImages = pic_list.map(item => ({ ...item, zoomed: false }))
      this.detailImages.forEach(item => {
        item.pic_name = item.pic_name.indexOf('http') !== -1 ? item.pic_name : baseUrl + '/' + item.pic_name
        // item.pic_name = baseUrl + '/' + item.pic_name
      })
      console.log('this.detailImages=====', this.detailImages)
    },
    handResize() {
      this.width = window.innerWidth
      this.height = window.innerHeight
      console.log('Resize:', this.width, this.height)
      if (this.width > this.height && this.width >= 768) {
        // 电脑设备，限制最大宽度，允许内容自然延展
        this.width = Math.min(window.innerWidth, 1070)
        // this.height = this.height
      } else {
        this.height = window.innerHeight
      }
      setTimeout(() => {
        this.calculatedHeight = (document.getElementsByClassName('main').length > 0 && document.getElementsByClassName('main')[0].offsetWidth * 9) / 16
      }, 500)
      // 重置缩放和平移
      this.resetZoomAndPan()
    },
    goBack() {
      this.$router.go(-1)
    },
    // 缩放相关方法
    onPinchStart() {
      this.lastScale = this.scale
    },
    onPinch(e) {
      // 计算新的缩放值
      let newScale = this.lastScale * e.scale

      // 限制缩放范围
      newScale = Math.max(this.minScale, Math.min(newScale, this.maxScale))

      this.scale = newScale
    },
    onPinchEnd() {
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
    onPanStart() {
      this.isPanning = true
      this.lastPanX = this.panX
      this.lastPanY = this.panY
    },
    onPan(e) {
      // 只有在放大状态下才允许平移
      if (this.scale > this.minScale) {
        // 计算新的平移值
        this.panX = this.lastPanX + e.deltaX
        this.panY = this.lastPanY + e.deltaY
      }
    },
    onPanEnd() {
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
    handleDoubleClick(e) {
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
    handleWheel(e) {
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
    resetZoomAndPan() {
      this.scale = this.minScale
      this.panX = 0
      this.panY = 0
      this.detailImages.forEach(item => {
        item.zoomed = false
      })
    },
    toggleImageSize(item) {
      item.zoomed = !item.zoomed
    },
    touchStart(event, item) {
      if (event.touches.length === 2) {
        // 记录两指初始距离
        this.initialPinchDistance = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        )
        this.lastZoomState = item.zoomed
      }
    },
    touchMove(event, item) {
      if (event.touches.length === 2) {
        // 计算当前两指距离
        const currentDistance = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        )

        // 计算缩放比例
        const scale = currentDistance / this.initialPinchDistance

        if (scale > 1.5 && !this.lastZoomState) {
          // 放大
          item.zoomed = true
        } else if (scale < 0.8 && this.lastZoomState) {
          // 缩小
          item.zoomed = false
        }
      }
    },
    touchEnd(event, item) {
      // 重置状态
      this.initialPinchDistance = 0
    }
  },
  watch: {
    // 监听路由参数变化
    '$route': {
      handler(to, from) {
  document.title = '壁报展示'
  if (to.name === 'details' && to.params.data) {
    console.log('路由参数变化，更新数据', to.params)
    this.poster_banner_status = to.params.poster_banner_status
    this.like_status = to.params.like_status
    this.watermark = to.params.watermark
    this.liked = false
    this.updateDetailData()
    // 重置缩放和平移状态
    this.resetZoomAndPan()
  }
      },
      deep: true
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handResize)

    // 移除事件监听器
    if (this.$refs.zoomContainer && this.$refs.zoomContainer.$el) {
      this.$refs.zoomContainer.$el.removeEventListener('dblclick', this.handleDoubleClick)
      this.$refs.zoomContainer.$el.removeEventListener('wheel', this.handleWheel)
    }
  }
}

</script>
<style lang="scss" scoped>
.main {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  .container {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    background: url("../assets/bigBG.png") no-repeat center center;
    background-size: 100% 100%;
    // height: 100vh;
    // width: 100vw;
    background-color: #fff;

    .detailsPage {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;

      .backBtn {
        width: 66px;
        height: 28px;
        background: rgba(71, 82, 110, .5);
        border-radius: 4px;
        font-family: Source Han Sans CN;
        font-weight: 700;
        color: #a1d7ff;
        font-size: 12px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
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
            
            .image-container {
              position: relative;
              width: 100%;
              overflow: hidden;
              
              img {
                width: 100%;
                vertical-align: bottom;
              }
              
              .watermark-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 10;
                opacity: 0.3;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
              }
            }

            &.watermarked {
              position: relative;
            }
          }
        }
      }

      .tips {
        color: rgba(255, 230, 0, 1);
        text-align: right;
        padding: 10px;
        position: sticky;
        top: 0;
        // background-color: rgba(255, 255, 255, 0.8);
        z-index: 10;
      }

      .copyright {
        margin-top: 10px;
        font-size: 12px;
        text-align: center;
        color: rgba(154, 211, 255, 1);
        padding-bottom: 10px;
      }

      .header {
        background-color: #03122c;
        height: 36px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 20px;
      }
    }
  }
}
</style>
