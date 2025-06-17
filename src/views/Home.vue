<template>
  <div class="container">
    <div class="main" :style="{ width: width + 'px' }">
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
          <Swipe type="mask" class="swipe"  :autoplay="autoplay">
            <SwipeItem class="advertisingImg" v-for="(item, index) in advertImages" :key="index">
              <a v-if="item.if_jump === 0" :href="item.jump_url" target="_blank" style="text-decoration: none; outline: none">
                <img v-lazy="item.pic_name" />
              </a>
              <div v-else style="display: block; width: 100%; height: 100%;">
                <img v-lazy="item.pic_name" />
              </div>
            </SwipeItem>
          </Swipe>
          <div class="advertSwitch" @click="showAdvert = false">
            {{ $t("close") }}
          </div>
        </div>
      </div>

      <div class="content" v-else>
        <Banner v-if="isShowBanner" :bannerData="bannerData" :meetingId="meetingId" :style="{
          width: '100%', height:
            calculatedHeight + 'px'
        }" />
        <div class="searchContent">
          <div class="selectType">
            <div class="Classification">
              <div class="ClassificationTitle">{{ $t("type1") }}</div>
              <el-select class="ClassificationSelect" popper-class="dataClass" v-model="categoryId1"
                @change="handSelectChange1" :placeholder="$t('pleaseSelect')">
                <el-option style="
                    height: 34px;
                    line-height: 34px;
                    font-size: 12px;
                    padding: 0 0.13rem;
                  " label="全部" :value="0">
                </el-option>
                <el-option style="
                    height: 34px;
                    line-height: 34px;
                    font-size: 12px;
                    padding: 0 0.13rem;
                  " v-for="item in categoryList1" :key="item.id" :label="item.name" :value="item.id">
                </el-option>
              </el-select>
            </div>
            <div class="Classification" v-show="categoryList2.length > 0 && isShowSecondType">
              <div class="ClassificationTitle">{{ $t("type2") }}</div>
              <el-select class="ClassificationSelect" :popper-append-to-body="false" popper-class="dataClass"
                v-model="categoryId2" @change="handSelectChange2" :placeholder="$t('pleaseSelect')">
                <el-option style="
                    height: 34px;
                    line-height: 34px;
                    font-size: 12px;
                    padding: 0 0.13rem;
                  " v-for="item in categoryList2" :key="item.id" :label="item.name" :value="item.id">
                </el-option>
              </el-select>
            </div>
          </div>
          <div class="selectContent">
            <div class="search">
              <el-input class="search-input" v-model="searchTxt" :placeholder="$t('placeholder')">
                <el-button @click="searchClick1" slot="append">{{ $t("search") }}</el-button>
              </el-input>
            </div>
            <div class="current" v-show="totalItems != 0 && isShowPage">
              <el-pagination small layout="prev, pager, next" :current-page.sync="currentPage"
                @size-change="handleSizeChange" @current-change="handleCurrentChange" :page-size="8" :total="totalItems"
                background>
              </el-pagination>
            </div>
            <div class="contentList" v-if="searchList && searchList.length">
              <div class="contentListItems" v-for="item in searchList" :key="item.id" @click="goDetail(item)">
                <div class="thumbnail" style="margin-right: 10px;" v-if="thumbnail">
                  <img v-show="item.pic_list[0].pic_name !== ''" style="height: 144px;width: 110px;"
                    v-lazy="item.pic_list[0].pic_name.indexOf('http') !== -1 ? item.pic_list[0].pic_name : baseUrl + '/' + item.pic_list[0].pic_name" />
                  <img v-show="item.pic_list[0].pic_name === ''" style="height: 144px;width: 110px;"
                    v-lazy="thumbnail_pic.indexOf('http') !== -1 ? thumbnail_pic : baseUrl + '/' + thumbnail_pic" />
                </div>
                <div style="display: flex;flex-direction: column;justify-content: center;">
                  <div class="topic public">
                    <div>{{ item.title }}</div>
                  </div>
                  <div class="topic info">
                    <div class="serialNumber public">
                      <div style="display: flex;align-items: center;">{{ $t("no") }}：{{ item.sort_number }}</div>
                    </div>
                    <div class="author public">
                      <div>{{ $t("author") }}：</div>
                      <div>{{ item.author }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="no-data" v-else>
              <div class="no-data-content">
                <i class="el-icon-warning-outline"></i>
                <p>{{ $t('noData') || '暂无数据' }}</p>
              </div>
            </div>
            <div class="current" v-show="totalItems != 0 && !isShowPage">
              <el-pagination small layout="prev, pager, next" :current-page.sync="currentPage"
                @size-change="handleSizeChange" @current-change="handleCurrentChange" :page-size="8"
                :total="totalItems">
              </el-pagination>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import { Swipe, SwipeItem, Lazyload, Toast } from 'vant'
import Banner from 'components/Banner'
import {
  getMeetingList,
  getAdvertising,
  getPosterList,
  getCategoryList
} from '@/api/user'
import { wxShare } from '@/utils/index'
// const { mapActions } = createNamespacedHelpers('test') // u53efu4f7fu7528u8fd9u79cdu65b9u5f0fu76f4u63a5u83b7u5f97testu6a21u677f
Vue.use(Lazyload)
Vue.use(Toast)
const baseUrl = 'https://eposter.tri-think.cn/uploadFile'
export default {
  name: 'home',
  components: {
    Swipe,
    SwipeItem,
    Banner
  },
  data () {
    return {
      baseUrl: 'https://eposter.tri-think.cn/uploadFile',
      width: window.innerWidth,
      height: window.innerHeight,
      advertImages: [],
      bannerImages: [],
      searchList: [],
      showAdvert: false,
      meetShowAdvert: true,
      isShowAdvert: false,
      isShowSecondType: false,
      searchTxt: '',
      totalItems: '0',
      currentPage: 1,
      itemsPerPage: 20,
      inactivityTimeout: [],
      lockDuration: '0',
      categoryList1: [],
      categoryList2: [],
      value: '',
      value2: '',
      categoryId1: '',
      categoryId2: '',
      meeting_id: 0,
      isShowPage: false,
      isShowBanner: true,
      widthBanner: 0,
      calculatedHeight: 0,
      bannerData: {},
      meetingId: 0,
      thumbnail: false,
      poster_banner_status: false,
      like_status: false,
      watermark: '',
      thumbnail_pic: '',
      meetObject: {},
      autoplay: 3000
    }
  },

  created () {
    document.title = '壁报展示'
    const url = window.location.href
    const fileExtension = url.split('.').pop().split(/[?#]/)
    const fileExtension2 =
      fileExtension[fileExtension.length - 1].split('=')[1]
    console.log(fileExtension2, 'fileExtension')

    const meeting_id = this.$route.query.meeting_id
    if (meeting_id) {
      this.meeting_id = Number(meeting_id)
      this.meetingId = Number(meeting_id)
    }
    console.log(this.meeting_id, '会议id')
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
      console.log(list, '获取会议列表成功')
      const meet = list.find((item) => item.id == this.meeting_id)
      this.meetObject = meet
      this.wxShare(this.meetObject, window.location.href)
      console.log(meet, 'xxxxxxxxx')
      if (meet.ad_status === '已关闭') {
        console.log('广告xxxx')
        this.showAdvert = false
        this.meetShowAdvert = false
      } else {
        this.showAdvert = !(this.$route.query.fromDetail && this.$route.query.fromDetail === 'true')
        this.meetShowAdvert = false
        console.log('广告开启xxxx')
      }
      if (meet.banner_status === '已关闭') {
        this.isShowBanner = false
      }
      this.thumbnail = meet.thumbnail === '已开启'
      this.poster_banner_status = meet.poster_banner_status === '已开启'
      this.like_status = meet.like_status === '已开启'
      this.watermark = meet.watermark
      this.thumbnail_pic = meet.thumbnail_pic
    })

    getAdvertising({
      'page': 1, // 页码
      'pageSize': 20, // 每页记录数
      'type': 'banner', // 类型：广告，banner
      'memo': '', // 备注
      'status': '已开启', // 已开启（前台写死），已关闭
      'meeting_id': this.meeting_id, // 会议id
      'uid': 1
    }).then(res => {
      this.bannerData = res.data
      console.log(this.bannerData, 'banner this.imageList')
    })

    getAdvertising({
      page: 1, // 页码
      pageSize: 20, // 每页记录数
      type: '广告', // 类型：广告，banner
      memo: '', // 备注
      status: '已开启', // 已开启（前台写死），已关闭
      meeting_id: this.meeting_id, // 会议id
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
          // this.showAdvert = true
          // setTimeout(() => {
          //   console.log('广告结束')
          //   this.showAdvert = false
          // }, list[0].stay_duration * 1000)
        }
        console.log(
          '获取广告信息成功',
          baseUrl + '/' + res.data.list[0].pic_name
        )
      })
      .catch((err) => {
        console.log('获取广告信息失败', err)
      })
    getCategoryList({
      name: '', // 类别名称
      level: 1, // 默认0全部，1一级类别，2二级类别
      pid: 0, // 父级类别id,默认0全部，
      meeting_id: this.meeting_id, // 会议id
      status: '已启用', // 类别开关：已启用（前端写死），已关闭
      page: 1, // 页码
      pageSize: 10, // 每页记录数
      uid: 1 // 记录id
    }).then((res) => {
      console.log('获取类别信息成功', res.data.list)
      const { list } = res.data
      this.categoryList1 = list
    })
    getPosterList({
      page: this.currentPage, // 页码
      pageSize: 8, // 每页记录数
      category_id:
        this.categoryId2 !== ''
          ? this.categoryId2
          : this.categoryId1 !== ''
            ? this.categoryId1
            : 0, // 类别id,0全部
      status: '已开启', // 已开启（前台写死），已关闭
      meeting_id: this.meeting_id, // 会议id，必填
      content: this.searchTxt, // 检索框内容
      uid: 1
    }).then((res) => {
      console.log('搜索数据', res)
      const { list, datacount, pagesum } = res.data
      this.searchList = list.map(item => ({ ...item, pic_list: item.pic_list === null ? [{ pic_name: '' }] : item.pic_list }))
      this.totalItems = datacount
      this.lockDuration = (list && list[0].lock_duration) || 0
      this.monitorInactivity()
    })
  },

  mounted () {
    for (let i = 0; i < 10000; i++) {
      clearTimeout(i)
    }
    window.addEventListener('resize', this.handResize)
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
  },
  methods: {
    wxShare,
    handleCurrentChange (val) {
      console.log(`当前页: ${val}`)
      this.currentPage = val // 改变当前页码
      this.searchClick()
    },
    handleSizeChange (val) {
      console.log(`每页 ${val} 条`)
      this.pageSize = val // 改变每页记录数
      this.searchClick()
    },
    resetTimer () {
      console.log(this.lockDuration, '重置定时器111')
      if (this.inactivityTimeout) {
        for (let i = 0; i < this.inactivityTimeout.length; i++) {
          clearTimeout(this.inactivityTimeout[i])
        }
      }
      this.monitorInactivity() // 重新开始监控
    },
    monitorInactivity () {
      if (this.lockDuration > 0) {
        console.log('wucccccccccccccccccc', this.lockDuration)

        if (this.inactivityTimeout) {
          for (let i = 0; i < this.inactivityTimeout.length; i++) {
            clearTimeout(this.inactivityTimeout[i])
          }
        }
        console.log('重置定时器', this.showAdvert)

        if (!this.meetShowAdvert) {
          console.log('开启广告')

          const timer = setTimeout(() => {
            this.showAdvert = true
          }, this.lockDuration * 1000)
          this.inactivityTimeout.push(timer)
          console.log('定时器开启', this.inactivityTimeout)
        }
      }
    },
    handResize () {
      this.width = window.innerWidth
      this.height = window.innerHeight
      console.log('Resize:', this.width, this.height)
      if (this.width > this.height && this.width >= 768) {
        // this.width = Math.min(this.width,1024)
        this.height = this.height
        this.widthBanner = this.height * (9 / 16)
        this.width = Math.min(window.innerWidth, 1070)
        this.isShowPage = true
        console.log('电脑设备: 9:16比例', this.width, this.height)
      } else {
        this.height = window.innerHeight
        this.widthBanner = this.width
        console.log('手机或平板: 全屏展示', this.width, this.height)
        this.isShowPage = false
      }
      setTimeout(() => {
        this.calculatedHeight = (document.getElementsByClassName('main').length > 0 && document.getElementsByClassName('main')[0].offsetWidth * 9) / 16
      }, 500)
    },
    handSelectChange1 (val) {
      console.log('handSelectChange1', val)
      this.categoryId2 = ''
      if (val == 0) {
        this.categoryId1 = 0
        this.categoryList2 = []
        return
      }
      getCategoryList({
        name: '', // 类别名称
        level: 2, // 默认0全部，1一级类别，2二级类别
        pid: val, // 父级类别id,默认0全部，
        meeting_id: this.meeting_id, // 会议id
        status: '已启用', // 类别开关：已启用（前端写死），已关闭
        page: 1, // 页码
        pageSize: 10, // 每页记录数
        uid: 1 // 记录id
      }).then((res) => {
        console.log('获取类别信息成功', res.data.list)
        const { list } = res.data
        this.categoryList2 = list || []
        this.isShowSecondType = true
      })
    },
    handSelectChange2 (val) {
      console.log('handSelectChange2', val)
      this.categoryId2 = val
    },
    searchClick1 () {
      this.currentPage = 1
      this.searchClick()
    },
    searchClick () {
      console.log('this.value', this.categoryId2)
      console.log('searchTxt', this.categoryId1)
      // if (this.searchTxt !== '') {
      //   this.currentPage = 1
      // }
      console.log('his.currentPag', this.currentPage)
      // this.currentPage = 1
      getPosterList({
        page: this.currentPage, // 页码
        pageSize: 8, // 每页记录数
        category_id:
          this.categoryId2 !== ''
            ? this.categoryId2
            : this.categoryId1 !== ''
              ? this.categoryId1
              : 0, // 类别id,0全部
        status: '已开启', // 已开启（前台写死），已关闭
        meeting_id: this.meeting_id, // 会议id，必填
        content: this.searchTxt, // 检索框内容
        uid: 1
      }).then((res) => {
        console.log('搜索数据', res)
        const { list, datacount, pagesum } = res.data
        this.searchList = list.map(item => ({ ...item, pic_list: item.pic_list === null ? [{ pic_name: '' }] : item.pic_list }))
        this.totalItems = datacount
        this.lockDuration = (list && list[0].lock_duration) || 0
      })
    },
    goDetail (item) {
      console.log('item', item)
      if (item.pic_list.length === 0) {
        return Toast(this.$t('wallNewspaperTips'))
      }
      if (!item.pic_list[0].pic_name) {
        return Toast(this.$t('wallNewspaperTips'))
      }
      item.lockDuration = this.lockDuration
      this.$router.push({
        name: 'details',
        query: {
          data: item,
          meeting_id: this.meeting_id,
          poster_banner_status: this.poster_banner_status,
          like_status: this.like_status,
          watermark: this.watermark || '',
          pageUrl: window.location.href
        }
      })
    }
  },
  watch: {
    '$route': {
      handler (to, from) {
        this.showAdvert = !(this.$route.query.fromDetail && this.$route.query.fromDetail === 'true')
        document.title = '壁报展示'
        this.searchTxt = ''
        this.categoryId1 = ''
        this.categoryId2 = ''
        this.searchClick1()
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
          console.log(list, '获取会议列表成功')
          const meet = list.find((item) => item.id == this.meeting_id)
          this.wxShare(meet, window.location.href)
          sessionStorage.setItem('pageHref', window.location.href)
        })
      },
      deep: true
    },
    showAdvert (val) {
      console.log('watch', val)
      this.searchTxt = ''
      this.categoryId1 = ''
      this.categoryId2 = ''
      this.searchClick1()
      if (!val) {
        this.monitorInactivity()
      } else {
        this.resetTimer()
      }
    },
    width (val) {
      this.width = val
    },
    height (val) {
      this.height = val
    }
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handResize)
    // window.removeEventListener("mousemove", this.resetTimer);
    window.removeEventListener('keydown', this.resetTimer)
    window.removeEventListener('mousemove', this.resetTimer)
    window.removeEventListener('touchstart', this.resetTimer)
    window.removeEventListener('touchmove', this.resetTimer)
    // 移除滚动事件监听器
    const container = document.querySelector('.container')
    if (container) {
      container.removeEventListener('scroll', this.resetTimer)
    }
    if (this.inactivityTimeout) {
      for (let i = 0; i < this.inactivityTimeout.length; i++) {
        clearTimeout(this.inactivityTimeout[i])
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.current {
  /* 分页组件样式 */
  margin-top: 10px;
  margin-bottom: 10px;
  display: flex;
  justify-content: center;

  ::v-deep .el-pagination {
    background-color: transparent;
    color: #a1d7ff;
    height: 22px;
    line-height: 22px;
    font-size: 12px;
  }

  ::v-deep .el-pagination .btn-prev,
  ::v-deep .el-pagination .btn-next,
  ::v-deep .el-pagination .el-pager li {
    background-color: rgba(71, 82, 110, 0.5);
    color: #a1d7ff;
    height: 20px;
    line-height: 20px;
    min-width: 20px;
  }

  ::v-deep .el-pagination .btn-prev,
  ::v-deep .el-pagination .btn-next {
    min-width: 20px;
    height: 20px;
    line-height: 20px;
    padding: 0;
  }

  ::v-deep .el-pagination button.btn-prev .el-icon,
  ::v-deep .el-pagination button.btn-next .el-icon {
    font-size: 12px;
  }

  ::v-deep .el-pagination .el-pager li:hover {
    color: #03122cff;
  }

  ::v-deep .el-pagination .el-pager li.active {
    background-color: #a1d7ffff;
    color: #03122cff;
  }

  ::v-deep .el-pagination .el-select .el-input .el-input__inner {
    background-color: rgba(71, 82, 110, 0.5);
    color: #a1d7ff;
    border-color: rgba(71, 82, 110, 0.7);
    height: 20px;
  }

  ::v-deep .el-pagination .el-pagination__total,
  ::v-deep .el-pagination .el-pagination__sizes {
    color: #a1d7ff;
  }

  ::v-deep .el-pagination .el-pagination__jump {
    color: #a1d7ff;
  }

  ::v-deep .el-pagination .el-pagination__editor.el-input .el-input__inner {
    background-color: rgba(71, 82, 110, 0.5);
    color: #a1d7ff;
    border-color: rgba(71, 82, 110, 0.7);
    height: 20px;
  }

  ::v-deep .el-pagination.is-background .btn-prev:disabled,
  ::v-deep .el-pagination.is-background .btn-next:disabled,
  ::v-deep .el-pagination.is-background .el-pager li.disabled {
    background-color: rgba(71, 82, 110, 0.3);
    color: rgba(255, 255, 255, 0.5);
  }

  ::v-deep .el-pagination.is-background .el-pager li:not(.disabled).active {
    background-color: #a1d7ffff;
    color: #03122cff;
    border-color: #a1d7ffff;
  }

  ::v-deep .el-pagination.is-background .el-pager li:not(.disabled):hover {
    background-color: #a1d7ffff;
    color: #03122cff;
    border-color: #a1d7ffff;
  }
}

html {
  font-size: 6px;
}

.search-input {
  height: 100% !important;

  ::v-deep .el-input__inner {
    background: #47526e;
    border-color: #47526e;
    color: rgb(161, 215, 255);
    height: 100% !important;
  }

  ::v-deep .el-input-group__append {
    background: rgba(161, 215, 255, 1);
    font-family: Source Han Sans CN;
    font-weight: 700;
    color: #03122c;
    font-size: 16px;
    border-color: #47526e;
    cursor: pointer;
  }

  ::v-deep .el-input__inner:focus {
    border-color: rgba(161, 215, 255, 1);
    background: rgba(22, 29, 35, 1);
    color: rgba(161, 215, 255, 1);
  }

  ::v-deep .el-input__inner:focus+.el-input-group__append {
    border-color: rgba(161, 215, 255, 1);
  }

  ::v-deep .el-input-group__append:hover {
    background: rgba(1, 147, 255, 1);
  }
}

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  // height: 100vh;
  width: 100vw;
  background-color: #fff;

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
  ::v-deep .van-pagination__item--active {
    background-color: #fff;
    color: #1989fa;
    height: 0.3rem;
    font-size: 0.26rem;
  }

  ::v-deep .van-pagination__item::after {
    border-width: 0;
  }

  ::v-deep .van-swipe__track {
    width: 100% !important;
  }

  ::v-deep .van-pagination {
    background-color: #fff;
    height: 0.3rem;
  }

  ::v-deep .van-pagination__item--disabled,
  .van-pagination__item--disabled:active {
    background-color: #fff;
    height: 0.3rem;
    font-size: 0.26rem;
  }

  ::v-deep .el-input {
    height: 100%;
    font-size: 0.18rem;
  }

  ::v-deep .el-input__inner {
    height: 100%;
    // border: 1px solid #797979;
  }

  ::v-deep .el-input__suffix {
    display: flex;
    align-items: center;
  }

  ::v-deep .el-select .el-input .el-select__caret {
    width: 0.4rem;
    font-size: 0.2rem;
  }

  ::v-deep .el-select-dropdown.el-popper .el-select-dropdown__empty {
    padding: 0.14rem 0;
    font-size: 0.16rem;
  }

  ::v-deep .el-select-dropdown__wrap {
    max-height: 274px;
    overflow-y: auto !important;
  }

  ::v-deep .el-input__inner {
    height: 0.58667rem;
    font-size: 10px;
  }

  ::v-deep .el-select {
    .el-input__inner {
      background: #47526e;
      border-color: #47526e;
      color: #c2e4ff;
    }
  }

  .main {
    position: relative;
    background-color: #fff;
    height: 100%;

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

    .content {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      border: 1px solid #ccc;

      .searchContent {
        width: 100%;
        flex-grow: 1;
        background: url("../assets/bigBG.png") no-repeat center center;
        background-size: 100% 100%;
        // height: 80%;

        .selectType {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          width: 100%;
          padding: 32px 20px 20px;
          // max-height: 15%;
          // border: 1px solid #DCDFE6;
          // margin-top: 10px;
          border-radius: 2%;
          box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
          box-sizing: border-box;

          .Classification {
            display: flex;
            align-items: center;
            // height: 30px;
            width: 48%;
            flex-direction: column;
            align-items: start;

            .ClassificationTitle {
              // width: 18%;
              text-align: center;
              // font-size: 0.2rem;
              line-height: normal;
              font-family: Source Han Sans CN;
              color: #c2e4ff;
              font-size: 12px;
              margin-bottom: 8px;
            }

            .ClassificationSelect {
              width: 100%;
              height: 80%;
              font-size: 0.17rem;
            }
          }
        }

        .selectContent {
          // height: 78.5%;
          // padding: 5%;
          padding: 0 20px;
          box-sizing: border-box;

          .search {
            display: flex;
            align-items: center;
            height: 25px;
            margin-top: 10px;

            // margin-bottom: 15px;
            // border: 1px solid #DCDFE6;
            .ipt {
              width: 80%;
              height: 100%;
              // border: none;
              border: 1px solid #dcdfe6;
            }

            .searchBtn {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 75px;
              max-width: 19%;
              height: 113%;
              margin-left: 0.1%;
              color: #909399;
              background-color: #f5f7fa;
              border: 1px solid #dcdfe6;
              border-radius: 7%;
            }
          }

          .contentList {
            margin-top: 15px;
            height: 93%;
            max-height: 93%;
            // overflow-y: auto;
            padding-bottom: 20px;

            .contentListItems {
              display: flex;
              flex-direction: row;
              // justify-content: center;
              // height: 60px;
              background: #47526e;
              border-radius: 8px;
              padding: 10px 15px;
              box-sizing: border-box;
              margin-bottom: 15px;
              width: 100%;
              cursor: pointer;
              transition: background-color 0.3s;

              &:hover {
                background: #5a6785;
              }

              .topic {
                &.public {
                  display: flex;
                  margin-bottom: 5px;
                  align-items: center;

                  div {
                    color: #a1d7ff;
                    font-size: 14px;
                    font-weight: 500;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  }
                }

                &.info {
                  display: flex;
                  justify-content: flex-start;

                  .serialNumber,
                  .author {
                    display: flex;
                    margin-right: 20px;
                    align-items: center;
                    div {
                      color: #c2e4ff;
                      font-size: 12px;
                    }
                  }
                }
              }
            }

            .contentListItems:last-child {
              margin-bottom: 0;
            }
          }

          .no-data {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            font-size: 16px;
            color: #909399;

            .no-data-content {
              display: flex;
              flex-direction: row;
              align-items: center;

              i {
                font-size: 24px;
                margin-right: 10px;
              }
            }
          }

          .current {
            display: flex;
            margin-top: 10px;
            height: 17%;
            text-align: center;
            font-size: 12px;
            align-items: center;
          }
        }
      }
    }

  }
}

@media (max-width: 768px) {
  .content {
    border: none !important;
    /* 在手机端隐藏边框 */
  }
}
</style>
