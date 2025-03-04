<template>
  <div class="container">
    <div class="detailsPage" :style="{ width: width + 'px', height: height + 'px' }">
      <!-- <div class="backBtn" @click="goBack">
        <Icon name="arrow-left" />{{ $t("back") }}
      </div> -->
      <div class="backBtn" @click="goBack">{{ $t("backen") }}</div>
      <div class="content-wrapper">
        <v-touch
          class="content"
          ref="zoomContainer"
          @pinchstart="onPinchStart"
          @pinch="onPinch"
          @pinchend="onPinchEnd"
          @panstart="onPanStart"
          @pan="onPan"
          @panend="onPanEnd"
          :style="contentStyle"
        >
          <div class="tips">{{ $t("tipsen") }} <Icon name="expand-o" /></div>
          <div class="imgItem" v-for="item in detailImages" :key="item.id">
            <img v-lazy="item.pic_name" alt="">
          </div>
          <div class="copyright">Copyright @ 2018-2025 TRI-THINK All Rights Reserved.</div>
        </v-touch>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import { Icon, Lazyload } from "vant"
import VueTouch from 'vue-touch'
// import { getAdvertising } from "@/api/user"
// import Banner from "components/Banner"
Vue.use(Lazyload)
Vue.use(VueTouch, { name: 'v-touch' })
const baseUrl = 'https://eposter.tri-think.cn/uploadFile'
export default {
  name: 'details',
  components: {
    // Banner,
    Icon,
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
      isPanning: false
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
    console.log("获取banner信息成功", this.itemData,this.$route.params.data)
    this.updateDetailData()
  },
  mounted() {
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
    updateDetailData() {
      this.itemData = this.$route.params.data
      if (!this.itemData) {
        console.error("没有传递有效的 itemData");
        return;
      }
      const { pic_list } = this.itemData
      this.detailImages = pic_list
      this.detailImages.forEach(item => {
        item.pic_name =item.pic_name.indexOf('http') !== -1 ? item.pic_name : baseUrl + '/' + item.pic_name
        // item.pic_name = baseUrl + '/' + item.pic_name
      })
      console.log("this.detailImages=====", this.detailImages);
    },
    handResize() {
      this.width = window.innerWidth
      this.height = window.innerHeight
      console.log('Resize:', this.width, this.height)
      if (this.width > this.height && this.width >= 768) {
        // this.width = Math.min(this.width,1024)
        this.height = this.height
        this.width = this.height * (9 / 16)
        console.log('电脑设备: 9:16比例', this.width, this.height)
      } else {
        this.height = window.innerHeight
        console.log('手机或平板: 全屏展示', this.width, this.height)
      }

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
      e.preventDefault()

      // 确定缩放方向和缩放步长
      const delta = e.deltaY < 0 ? 0.2 : -0.2
      let newScale = this.scale + delta

      // 限制缩放范围
      newScale = Math.max(this.minScale, Math.min(newScale, this.maxScale))

      // 如果缩放值没有变化，不做任何处理
      if (newScale === this.scale) return

      // 计算鼠标位置为缩放中心
      const rect = this.$refs.zoomContainer.$el.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top

      // 计算新的平移值，使鼠标位置成为缩放中心
      const scaleFactor = newScale / this.scale
      const newPanX = offsetX - (offsetX - this.panX) * scaleFactor
      const newPanY = offsetY - (offsetY - this.panY) * scaleFactor

      this.scale = newScale
      this.panX = newPanX
      this.panY = newPanY

      // 如果缩放回到原始大小，重置平移
      if (this.scale === this.minScale) {
        this.resetZoomAndPan()
      }
    },
    // 重置缩放和平移
    resetZoomAndPan() {
      this.scale = this.minScale
      this.panX = 0
      this.panY = 0
    }
  },
  watch: {
    // 监听路由参数变化
    '$route'(to, from) {
      if (to.name === 'details' && to.params.data) {
        console.log('路由参数变化，更新数据', to.params.data)
        this.updateDetailData()
        // 重置缩放和平移状态
        this.resetZoomAndPan()
      }
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
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  // height: 100vh;
  width: 100vw;
  background-color: #f5f5f5;

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
      overflow: hidden; /* 修改为hidden，防止内容溢出 */
      box-sizing: border-box;
      position: relative; /* 添加相对定位 */

      .content {
        width: 100%;
        height: 100%;
        touch-action: none; /* 防止浏览器默认的触摸行为 */
        will-change: transform; /* 优化性能 */

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
