import Vue from 'vue'
import 'lib-flexible'
import App from './App.vue'
import router from '@/router'
import store from '@/store'
import 'utils/permission'
import SvgIcon from 'components/SvgIcon'
import '@/icons' // icon
import '@/style/common.scss'
import { Lazyload } from 'vant'
import defaultSettings from '@/settings'
import VueCropper from 'vue-cropper'
import i18n from '@/lang'

// 引入Element UI
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

/**
 * If you don't want to use mock-server
 * you want to use MockJs for mock api
 * you can execute: mockXHR()
 *
 * Currently MockJs will be used in the production environment,
 * please remove it before going online! ! !
 */
import { mockXHR } from '../mock'

if (process.env.NODE_ENV === 'production') {
  mockXHR()
}

// options 为可选参数，无则不传
Vue.use(Lazyload)

// 全局注册Element UI
Vue.use(ElementUI)

Vue.component('svg-icon', SvgIcon)

if (process.env.NODE_ENV === 'development' && defaultSettings.vconsole) {
  const VConsole = require('vconsole')
  // eslint-disable-next-line
  const my_console = new VConsole()
}
// var vConsole = new VConsole(option)

Vue.use(VueCropper)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  i18n,
  render: h => h(App)
}).$mount('#app')
