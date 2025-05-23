<template>
  <div style="display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  background-color: #fff;">
    <div class="main" :style="{ width: width + 'px' }" style="margin: 0 auto">
    <Banner :meetingId="meetingId" v-show="poster_banner_status" :bannerData="bannerData"
      :style="{ width: '100%', height: calculatedHeight + 'px' }" />
    <div class="container">
      <div class="detailsPage" :style="{ width: width + 'px' }">
        <div class="header">
          <div class="backBtn" @click="goBack"><i
              style="font-size: 22px;margin-left: -15px;margin-right: 3px;margin-top: 3px;"
              class="el-icon-arrow-left"></i> {{ $t("backen") }}</div>
          <div class="backBtn" style="margin-right: auto;margin-left: 20px;" @click="likeFun"
            v-show="like_status && !liked"><img style="width: 24px; height: 24px;margin-right: 5px;"
              src="@/assets/like.png" alt="">{{ $t("likeen") }}</div>
          <div class="backBtn" style="background:#db8a10;color: #fff;margin-right: auto;margin-left: 20px;"
            v-show="like_status && liked"><img style="width: 24px; height: 24px;margin-right: 5px;"
              src="@/assets/like1.png" alt="">{{ $t("likeen") }}</div>
          <div class="tips">{{ $t("tipsen") }}</div>
        </div>
        <div class="content-wrapper">
          <div class="imgItem" v-for="item in detailImages" :key="item.id">
            <div class="image-container" :style="{ position: 'relative' }">
              <!-- 显示加载指示器，当图片正在处理时 -->
              <!-- <div v-if="item.processing" class="loading-indicator">
                <div class="spinner"></div>
                <div>处理图片中...</div>
              </div> -->
              <!-- 处理完成后显示图片 -->
              <img v-lazy="item.pic_name" alt="" @dblclick="toggleImageSize(item)"
                @touchstart="touchStart($event, item)" @touchmove="touchMove($event, item)"
                @touchend="touchEnd($event, item)" :style="{ width: item.zoomed ? '200%' : '100%' }">
            </div>
          </div>
          <div class="copyright">Copyright @ 2018-2025 TRI-THINK All Rights Reserved.</div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script>
import Vue from 'vue'
import { Icon, Lazyload } from 'vant'
import VueTouch from 'vue-touch'
import Banner from 'components/Banner1'
import { wxShare } from '@/utils/index'
import { getAdvertising, getPosterLikeAdd, getBase64Image, getMeetingList } from '@/api/user'
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
  data () {
    return {
      baseUrl: 'https://eposter.tri-think.cn/uploadFile',
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
      bannerData: { list: [] },
      initialPinchDistance: 0,
      lastZoomState: false,
      poster_banner_status: false,
      like_status: false,
      watermark: '',
      liked: false,
      meetObject: {}
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
    document.title = '壁报展示'
    console.log('获取banner信息成功', this.itemData, this.$route.params.data)
    // this.meetingId = this.$route.params.data.meeting_id
    if (this.$route.params.data && this.$route.params.data.meeting_id) {
      this.meetingId = this.$route.params.data.meeting_id
    }

    this.updateDetailData()
  },
  mounted () {
    getAdvertising({
      'page': 1, // 页码
      'pageSize': 20, // 每页记录数
      'type': 'banner', // 类型：广告，banner
      'memo': '', // 备注
      'status': '已开启', // 已开启（前台写死），已关闭
      'meeting_id': this.meetingId, // 会议id
      'uid': 1
    }).then(res => {
      this.bannerData = res.data || { list: [] }
      console.log(this.bannerData, 'banner this.imageList')
    })
    this.poster_banner_status = this.$route.query.poster_banner_status
    this.like_status = this.$route.query.like_status
    this.watermark = this.$route.query.watermark
    window.addEventListener('resize', this.handResize)
    this.handResize()
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
      const meet = list.find((item) => item.id == this.meeting_id)

      this.meetObject = meet
      this.wxShare(this.meetObject)
    })
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
    getBaseImage (item, index) {
      // 设置处理状态
      this.$set(this.detailImages[index], 'processing', true)

      // 存储原始图片路径
      const originalPath = item.pic_name
      let fileName = originalPath

      // // 从URL中提取文件名
      // if (originalPath.indexOf('http') !== -1) {
      //   fileName = originalPath.split('/').pop() // 获取文件名部分
      // }

      console.log('获取Base64图片，文件名:', fileName)

      // 调用API获取Base64图片
      getBase64Image({
        'fileName': fileName
      }).then(res => {
        if (res.code === 0 && res.data) {
          // 成功获取到Base64图片
          console.log('成功获取Base64图片')
          // 添加水印并设置到detailImages中
          this.addWatermarkToBase64(res.data, index)
        } else {
          console.error('获取Base64图片失败:', res)
          // 失败时使用原图
          this.$set(this.detailImages[index], 'processing', false)
        }
      }).catch(err => {
        console.error('获取Base64图片异常:', err)
        // 异常时使用原图
        this.$set(this.detailImages[index], 'processing', false)
      })
    },

    // 为Base64图片添加水印
    addWatermarkToBase64 (base64Data, index) {
      // 创建图片对象加载Base64数据
      const img = new Image()

      // 设置加载事件处理
      img.onload = () => {
        try {
          // 创建Canvas
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          // 设置Canvas尺寸匹配图片
          canvas.width = img.width
          canvas.height = img.height

          // 在Canvas上绘制原图
          ctx.drawImage(img, 0, 0, img.width, img.height)

          if (this.watermark !== '') {
            // 在画布上绘制斜向水印
            const watermarkText = this.watermark

            // 设置透明度和字体
            ctx.globalAlpha = 0.2 // 设置水印整体透明度
            ctx.font = 'bold 35px Arial' // 调整字体大小到35px
            ctx.fillStyle = '#000000'

            // 计算水印文本大小以适当间隔
            const metrics = ctx.measureText(watermarkText)
            const textWidth = metrics.width
            const spacing = textWidth * 1.5 // 减小文本间距

            // 实现对角线交错水印
            ctx.save() // 保存当前状态
            ctx.translate(0, 0)
            ctx.rotate(-Math.PI / 6) // 旋转 -30 度

            // 计算需要绘制的水印行数和列数 - 减少水印密度
            const rowCount = Math.ceil(img.width * 1 / spacing)
            const colCount = Math.ceil(img.height * 1 / spacing)

            // 绘制水印网格
            for (let i = -rowCount; i < rowCount * 5; i++) {
              for (let j = -colCount; j < colCount * 5; j++) {
                ctx.fillText(watermarkText, i * spacing, j * spacing)
              }
            }

            ctx.restore() // 恢复旋转前的状态
            ctx.globalAlpha = 1.0 // 恢复透明度
          }

          // 将Canvas转换为base64图片URL
          const watermarkedImageUrl = canvas.toDataURL('image/jpeg', 0.8) // 0.8质量以减小大小

          // 更新detailImages数组中的图片
          console.log('水印图片生成成功')
          this.$set(this.detailImages[index], 'pic_name', watermarkedImageUrl)
          this.$set(this.detailImages[index], 'processing', false)
        } catch (err) {
          console.error('Canvas操作失败:', err)
          // 使用原图
          this.$set(this.detailImages[index], 'processing', false)
        }
      }

      // 处理加载错误
      img.onerror = () => {
        console.error('图片加载失败')
        // 加载失败时使用原图
        this.$set(this.detailImages[index], 'processing', false)
      }

      // 加载Base64图片
      img.src = 'data:image/jpeg;base64,' + base64Data
    },
    likeFun () {
      getPosterLikeAdd({
        'id': this.meetingId
      }).then(res => {
        this.liked = !this.liked
      })
    },
    updateDetailData () {
      // 优先从 params 中获取数据
      this.itemData = this.$route.query.data

      // 从 URL 查询参数中获取参数
      this.meetingId = parseInt(this.$route.query.meeting_id) || 0
      this.poster_banner_status = this.$route.query.poster_banner_status
      this.like_status = this.$route.query.like_status
      this.watermark = this.$route.query.watermark || ''
      if (!this.itemData) {
        console.error('没有传递有效的 itemData')
        return
      }
      const { pic_list } = this.itemData
      this.detailImages = pic_list.map(item => ({
        ...item,
        zoomed: false,
        processing: true // 标记为正在处理中
      }))

      // 处理每张图片添加水印
      this.detailImages.forEach((item, index) => {
        this.getBaseImage(item, index)
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
    goBack () {
      this.$router.go(-1)
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
      this.detailImages.forEach(item => {
        item.zoomed = false
      })
    },
    toggleImageSize (item) {
      item.zoomed = !item.zoomed
    },
    touchStart (event, item) {
      if (event.touches.length === 2) {
        // 记录两指初始距离
        this.initialPinchDistance = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        )
        this.lastZoomState = item.zoomed
      }
    },
    touchMove (event, item) {
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
    touchEnd (event, item) {
      // 重置状态
      this.initialPinchDistance = 0
    }
  },
  watch: {
    // 监听路由参数变化
    '$route': {
      handler (to, from) {
        document.title = 'eposter'
        if (to.name === 'detailsEn' && to.params.data) {
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
  beforeDestroy () {
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
::v-deep .van-swipe__track {
    width: 100% !important;
  }

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

              .loading-indicator {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 200px;
                color: #a1d7ff;
                font-size: 14px;
                background-color: rgba(0, 0, 0, 0.05);

                .spinner {
                  width: 40px;
                  height: 40px;
                  border: 4px solid rgba(161, 215, 255, 0.3);
                  border-radius: 50%;
                  border-top-color: #a1d7ff;
                  animation: spin 1s ease-in-out infinite;
                  margin-bottom: 10px;
                }

                @keyframes spin {
                  to {
                    transform: rotate(360deg)
                  }
                }
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
