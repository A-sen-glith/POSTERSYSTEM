<template>
  <div class="container">
    <div class="main" :style="{ width: width + 'px' }">
      <div
        style="
          position: fixed;
          background-color: #f5f5f5;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        "
        v-if="showAdvert"
      >
        <div
          class="advert"
          :style="{
            width: widthBanner + 'px',
            marginLeft: '50%',
            transform: 'translate(-50%)',
          }"
        >
          <Swipe type="mask" class="swipe">
            <SwipeItem
              class="advertisingImg"
              v-for="(item, index) in advertImages"
              :key="index"
            >
              <a
                :href="item.jump_url"
                style="text-decoration: none; outline: none"
              >
                <img v-lazy="item.pic_name" />
              </a>
            </SwipeItem>
          </Swipe>
          <div class="advertSwitch" @click="showAdvert = false">
            {{ $t("closeen") }}
          </div>
        </div>
      </div>

      <div class="content" v-else>
        <Banner v-if="isShowBanner" style="width: 100%; height: 20%" />
        <div class="searchContent">
          <div class="selectType">
            <div class="Classification">
              <div class="ClassificationTitle">{{ $t("type1en") }}</div>
              <Select
                class="ClassificationSelect"
                popper-class="dataClass"
                v-model="categoryId1"
                @change="handSelectChange1"
                :placeholder="$t('pleaseSelecten')"
              >
                <Option
                  style="
                    height: 34px;
                    line-height: 34px;
                    font-size: 12px;
                    padding: 0 0.13rem;
                  "
                  label="全部"
                  :value="0"
                >
                </Option>
                <Option
                  style="
                    height: 34px;
                    line-height: 34px;
                    font-size: 12px;
                    padding: 0 0.13rem;
                  "
                  v-for="item in categoryList1"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                >
                </Option>
              </Select>
            </div>
            <div
              class="Classification"
              v-show="categoryList2.length > 0 && isShowSecondType"
            >
              <div class="ClassificationTitle">{{ $t("type2en") }}</div>
              <Select
                class="ClassificationSelect"
                :popper-append-to-body="false"
                popper-class="dataClass"
                v-model="categoryId2"
                @change="handSelectChange2"
                :placeholder="$t('pleaseSelecten')"
              >
                <Option
                  style="
                    height: 34px;
                    line-height: 34px;
                    font-size: 12px;
                    padding: 0 0.13rem;
                  "
                  v-for="item in categoryList2"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                >
                </Option>
              </Select>
            </div>
          </div>
          <div class="selectContent">
            <div class="search">
              <input
                class="ipt"
                v-model="searchTxt"
                :placeholder="$t('placeholderen')"
              />
              <div class="searchBtn" @click="searchClick">
                {{ $t("searchen") }}
              </div>
            </div>
            <div class="current" v-show="totalItems != 0 && isShowPage">
              <Pagination
                small
                layout="prev, pager, next"
                :current-page.sync="currentPage"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                :page-size="6"
                :total="totalItems"
              >
              </Pagination>
            </div>
            <div class="contentList" v-if="searchList">
              <div
                class="contentListItems"
                v-for="item in searchList"
                :key="item.id"
                @click="goDetail(item)"
              >
                <div class="serialNumber public">
                  <div>{{ $t("noen") }}：</div>
                  <div>{{ item.sort_number }}</div>
                </div>
                <div class="author public">
                  <div>{{ $t("authoren") }}：</div>
                  <div>{{ item.author }}</div>
                </div>
                <div class="topic public">
                  <div>{{ $t("titleen") }}：</div>
                  <div>{{ item.title }}</div>
                </div>
              </div>
            </div>
            <div class="current" v-show="totalItems != 0 && !isShowPage">
              <Pagination
                small
                layout="prev, pager, next"
                :current-page.sync="currentPage"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                :page-size="6"
                :total="totalItems"
              >
              </Pagination>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import { Swipe, SwipeItem, Lazyload, Icon } from "vant";
import { Select, Option, Pagination } from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import Banner from "components/Banner";
import {
  getMeetingList,
  getAdvertising,
  getPosterList,
  getCategoryList,
} from "@/api/user";
// const { mapActions } = createNamespacedHelpers('test') // 可使用这种方式直接获得test模板
Vue.use(Lazyload);
const baseUrl = "https://eposter.tri-think.cn/uploadFile";
export default {
  name: "home",
  components: {
    Swipe,
    SwipeItem,
    Icon,
    Banner,
    Pagination,
    Select,
    Option,
  },
  data() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      advertImages: [],
      bannerImages: [],
      searchList: [],
      showAdvert: false,
      isShowSecondType: false,
      searchTxt: "",
      totalItems: "0",
      currentPage: 1,
      itemsPerPage: 20,
      inactivityTimeout: null,
      lockDuration: "0",
      categoryList1: [],
      categoryList2: [],
      value: "",
      value2: "",
      categoryId1: "",
      categoryId2: "",
      meeting_id: 0,
      isShowPage: false,
      isShowBanner: true,
      widthBanner: 0,
    };
  },
  computed: {},
  created() {
    document.title = "eposter";
    const url = window.location.href;
    const fileExtension = url.split(".").pop().split(/[?#]/);
    const fileExtension2 =
      fileExtension[fileExtension.length - 1].split("=")[1];
    console.log(fileExtension2, "fileExtension");

    const meeting_id = this.$route.query.meeting_id;
    if (meeting_id) {
      this.meeting_id = Number(meeting_id);
    }
    console.log(this.meeting_id, "会议id");
    getMeetingList({
      id: undefined,
      meeting_name: "", // 会议名称
      address: "", // 地点
      username: "", // 用户名（登录类型为会议，需要传这个）
      customerid: 0,
      type: "管理员",
      page: 1, // 会议id，必填
      pageSize: 1000, // 搜索框内容
      uid: 1,
    }).then((res) => {
      const { list } = res.data;
      console.log(list, "获取会议列表成功");
      const meet = list.find((item) => item.id == this.meeting_id);
      console.log(meet, "xxxxxxxxx");
      if (meet.ad_status === "已关闭") {
        console.log("广告xxxx");
        this.showAdvert = false;
      } else {
        this.showAdvert = true;
        console.log("广告开启xxxx");
      }
      if (meet.banner_status === "已关闭") {
        this.isShowBanner = false;
      }
    });
    getAdvertising({
      page: 1, // 页码
      pageSize: 20, // 每页记录数
      type: "广告", // 类型：广告，banner
      memo: "", // 备注
      status: "已开启", // 已开启（前台写死），已关闭
      meeting_id: this.meeting_id, // 会议id
      uid: 1,
    })
      .then((res) => {
        const { list } = res.data;
        this.advertImages = list || [];
        this.advertImages.forEach((item) => {
          item.pic_name = baseUrl + "/" + item.pic_name;
        });
        if (this.advertImages.length > 0) {
          // this.showAdvert = true
          setTimeout(() => {
            console.log("广告结束");
            this.showAdvert = false;
          }, list[0].stay_duration * 1000);
        }
        console.log(
          "获取广告信息成功",
          baseUrl + "/" + res.data.list[0].pic_name
        );
      })
      .catch((err) => {
        console.log("获取广告信息失败", err);
      });
    getCategoryList({
      name: "", // 类别名称
      level: 1, // 默认0全部，1一级类别，2二级类别
      pid: 0, // 父级类别id,默认0全部，
      meeting_id: this.meeting_id, // 会议id
      status: "已启用", // 类别开关：已启用（前端写死），已关闭
      page: 1, // 页码
      pageSize: 10, // 每页记录数
      uid: 1, // 记录id
    }).then((res) => {
      console.log("获取类别信息成功", res.data.list);
      const { list } = res.data;
      this.categoryList1 = list;
    });
    getPosterList({
      page: this.currentPage, // 页码
      pageSize: 5, // 每页记录数
      category_id:
        this.categoryId2 !== ""
          ? this.categoryId2
          : this.categoryId1 !== ""
          ? this.categoryId1
          : 0, // 类别id,0全部
      status: "已开启", // 已开启（前台写死），已关闭
      meeting_id: this.meeting_id, // 会议id，必填
      content: this.searchTxt, // 检索框内容
      uid: 1,
    }).then((res) => {
      console.log("搜索数据", res);
      const { list, datacount, pagesum } = res.data;
      this.searchList = list;
      this.totalItems = datacount;
      this.lockDuration = (list && list[0].lock_duration) || 0;
      this.monitorInactivity();
    });
  },
  mounted() {
    for (let i = 0; i < 10000; i++) {
      clearTimeout(i);
    }
    window.addEventListener("resize", this.handResize);
    this.handResize();
  },
  methods: {
    handleCurrentChange(val) {
      console.log(`当前页: ${val}`);
      this.currentPage = val; // 改变当前页码
      this.searchClick();
    },
    handleSizeChange(val) {
      console.log(`每页 ${val} 条`);
      this.pageSize = val; // 改变每页记录数
      this.searchClick();
    },
    resetTimer() {
      if (this.inactivityTimeout) {
        for (let i = 0; i < this.inactivityTimeout + 1000; i++) {
          clearTimeout(i);
        }
        // clearTimeout(this.inactivityTimeout);
      }
      this.monitorInactivity(); // 重新开始监控
    },
    monitorInactivity() {
      if (this.lockDuration > 0) {
        console.log("wucccccccccccccccccc", this.lockDuration);
        const resetTimer = () => {
          if (this.inactivityTimeout) {
            for (let i = 0; i < this.inactivityTimeout; i++) {
              clearTimeout(i);
            }
          }
          this.inactivityTimeout = setTimeout(() => {
            this.showAdvert = true;
            // this.lockDuration
          }, this.lockDuration * 1000);
        };
        // window.addEventListener("mousemove", resetTimer);
        window.addEventListener("keydown", resetTimer);
        // window.addEventListener("touchstart", resetTimer);
        // window.addEventListener("touchmove", resetTimer);
        resetTimer();
      }
    },
    handResize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      console.log("Resize:", this.width, this.height);
      if (this.width > this.height && this.width >= 768) {
        // this.width = Math.min(this.width,1024)
        this.height = this.height;
        this.widthBanner = this.height * (9 / 16);
        this.width = Math.min(window.innerWidth, 1070);
        this.isShowPage = true;
        console.log("电脑设备: 9:16比例", this.width, this.height);
      } else {
        this.height = window.innerHeight;
        this.widthBanner = this.width;
        console.log("手机或平板: 全屏展示", this.width, this.height);
        this.isShowPage = false;
      }
    },
    handSelectChange1(val) {
      console.log("handSelectChange1", val);
      this.categoryId2 = "";
      if (val == 0) {
        this.categoryId1 = 0;
        this.categoryList2 = [];
        return;
      }
      getCategoryList({
        name: "", // 类别名称
        level: 2, // 默认0全部，1一级类别，2二级类别
        pid: val, // 父级类别id,默认0全部，
        meeting_id: this.meeting_id, // 会议id
        status: "已启用", // 类别开关：已启用（前端写死），已关闭
        page: 1, // 页码
        pageSize: 10, // 每页记录数
        uid: 1, // 记录id
      }).then((res) => {
        console.log("获取类别信息成功", res.data.list);
        const { list } = res.data;
        this.categoryList2 = list || [];
        this.isShowSecondType = true;
      });
    },
    handSelectChange2(val) {
      console.log("handSelectChange2", val);
      this.categoryId2 = val;
    },
    searchClick() {
      console.log("this.value", this.categoryId2);
      console.log("searchTxt", this.categoryId1);
      // if(!this.searchTxt.trim()){
      //   return Toast("请输入搜索内容");
      // }
      getPosterList({
        page: this.currentPage, // 页码
        pageSize: 5, // 每页记录数
        category_id:
          this.categoryId2 !== ""
            ? this.categoryId2
            : this.categoryId1 !== ""
            ? this.categoryId1
            : 0, // 类别id,0全部
        status: "已开启", // 已开启（前台写死），已关闭
        meeting_id: this.meeting_id, // 会议id，必填
        content: this.searchTxt, // 检索框内容
        uid: 1,
      }).then((res) => {
        console.log("搜索数据", res);
        const { list, datacount, pagesum } = res.data;
        this.searchList = list;
        this.totalItems = datacount;
        this.lockDuration = (list && list[0].lock_duration) || 0;
      });
    },
    goDetail(item) {
      console.log("item", item);
      this.$router.push({ name: "detailsEn", params: { data: item } });
    },
  },
  watch: {
    '$route': {
      handler(to, from) {
        document.title = "eposter";
      },
      deep: true
    },
    width(val) {
      this.width = val;
    },
    height(val) {
      this.height = val;
    },
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handResize);
    // window.removeEventListener("mousemove", this.resetTimer);
    window.removeEventListener("keydown", this.resetTimer);
    // window.removeEventListener("touchstart", this.resetTimer);
    // window.removeEventListener("touchmove", this.resetTimer);

    if (this.inactivityTimeout) {
      for (let i = 0; i < this.inactivityTimeout + 1000; i++) {
        clearTimeout(i);
      }
    }
  },
};
</script>
<style lang="scss" scoped>
html {
  font-size: 6px;
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
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
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

  ::v-deep .dataClass {
    // height: 20px !important;
    padding: 0;
    font-size: 6px;
  }

  ::v-deep .el-select-dropdown__wrap {
    max-height: 274px;
    overflow-y: auto !important;
  }

  ::v-deep .el-input__inner {
    height: 0.58667rem;
    font-size: 10px;
  }

  .main {
    position: relative;
    background-color: #fff;
    border: 1px solid #ccc;
    min-height: 100vh;
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
      width: 100%;
      height: 100%;

      .searchContent {
        width: 100%;
        height: 80%;

        .selectType {
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          width: 99.8%;
          padding: 10px 0;
          max-height: 15%;
          // border: 1px solid #DCDFE6;
          margin-top: 10px;
          border-radius: 2%;
          box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
          box-sizing: border-box;

          .Classification {
            display: flex;
            align-items: center;
            height: 30px;

            .ClassificationTitle {
              width: 18%;
              text-align: center;
              font-size: 0.2rem;
            }

            .ClassificationSelect {
              width: 60%;
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
            .contentListItems {
              // margin-top: 2%;
              // margin-bottom: 20px;
              // padding-top: 4%;
              // border: 1px solid #797979;
              // box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.2);

              display: flex;
              flex-direction: column;
              justify-content: center;
              line-height: 1.5;
              box-shadow: 0 0 10px 1px rgba(72, 118, 255, 0.3);
              border-radius: 5px;
              padding: 5px 10px;
              box-sizing: border-box;
              margin-bottom: 15px;
              width: 100%;
              cursor: pointer;

              // 11
              .public {
                display: flex;

                div {
                  margin-bottom: 1%;
                }
              }
            }

            .contentListItems .public div:first-child {
              width: 20%;
              text-align: right;
            }

            .contentListItems .public div:last-child {
              width: 70%;
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
</style>
