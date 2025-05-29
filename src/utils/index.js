/**
 * @param {string} url
 * @returns {Object}
 */
import { JssdkConfig } from '../api/user.js'

export function param2Obj (url) {
  const search = url.split('?')[1]
  if (!search) {
    return {}
  }
  return JSON.parse(
    '{"' +
      decodeURIComponent(search)
        .replace(/"/g, '\\"')
        .replace(/&/g, '","')
        .replace(/=/g, '":"')
        .replace(/\+/g, ' ') +
      '"}'
  )
}

export function deepClone (source) {
  if (!source && typeof source !== 'object') {
    throw new Error('error arguments', 'deepClone')
  }
  const targetObj = source.constructor === Array ? [] : {}
  Object.keys(source).forEach(keys => {
    if (source[keys] && typeof source[keys] === 'object') {
      targetObj[keys] = deepClone(source[keys])
    } else {
      targetObj[keys] = source[keys]
    }
  })
  return targetObj
}

export function wxShare (meetObject, pageUrl) {
  // 添加默认值，防止 meetObject 为空
  meetObject = meetObject || {}
  let share_abstract = meetObject.share_abstract || '海报系统'
  let share_logo = `https://eposter.tri-think.cn/uploadFile/${meetObject.share_logo}` || 'https://eposter.tri-think.cn/uploadFile/poster/p_watermark.png'
  let share_title = meetObject.share_title || '海报系统'
  console.log('微信分享参数:', meetObject, share_abstract, share_logo, share_title)
  // 获取当前URL，处理hash符号和参数
  // 微信JS SDK在验证时会自动去除hash部分，所以我们需要使用相同的URL来获取签名
  let currentUrl = pageUrl || window.location.href
  let signUrl = currentUrl.split('#')[0] // 去除hash部分，用于获取签名
  let baseUrl = currentUrl.split('?')[0] // 去除参数部分，用于分享链接
  console.log('准备配置微信分享:')
  console.log('- 完整URL:', currentUrl)
  console.log('- 签名URL:', signUrl)
  console.log('- 分享URL:', baseUrl)
  JssdkConfig({ code: 1, url: signUrl })
    .then(response => {
      console.log('JssdkConfig响应:', response)
      // 安全地解析JSON数据
      let data
      try {
        if (typeof response === 'string') {
          data = JSON.parse(response)
        } else {
          data = response
        }
      } catch (e) {
        console.error('解析JssdkConfig响应失败:', e)
        return
      }
      // alert(data.data.appId)
      // alert(data.data.appId);
      console.log('配置微信SDK，appId:', data.data.appId)
      wx.config({
        // debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来
        appId: data.data.appId, // 必填，公众号的唯一标识
        timestamp: data.data.timestamp, // 必填，生成签名的时间戳
        nonceStr: data.data.nonceStr, // 必填，生成签名的随机串
        signature: data.data.signature, // 必填，签名，见附录1
        jsApiList: [
          'chooseWXPay',
          'updateAppMessageShareData',
          'updateTimelineShareData',
          'onMenuShareQQ',
          'onMenuShareAppMessage', // 旧的接口，即将废弃(网上说是要把旧接口也填上去，不然注册会失败)
          'onMenuShareTimeline' // 旧的接口，即将废弃
        ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
      })
      wx.ready(function () {
        console.log('微信SDK准备就绪')
        // 监听“分享到朋友圈”按钮点击、自定义分享内容及分享结果接口
        wx.updateTimelineShareData({
          title: share_title,
          desc: share_abstract,
          link: currentUrl,
          imgUrl: share_logo,
          success: function (res) {
            // $.ajax({
            //     url: 'index.php?r=mob/data',
            //     type:'post',
            //     success: function (data){
            //     },
            //     cache: false
            // });
          },
          cancel: function (res) {
          }
        })

        wx.updateAppMessageShareData({
          title: share_title,
          desc: share_abstract,
          link: currentUrl,
          imgUrl: share_logo,
          success: function (res) {
            // $.ajax({
            //     url: 'index.php?r=mob/data',
            //     type:'post',
            //     success: function (data){
            //     },
            //     cache: false
            // });
          },
          cancel: function (res) {
          }
        })

        wx.onMenuShareQQ({
          title: share_title,
          desc: share_abstract,
          link: currentUrl,
          imgUrl: share_logo,
          success: function (res) {
            // $.ajax({
            //     url: 'index.php?r=mob/data',
            //     type:'post',
            //     success: function (data){
            //     },
            //     cache: false
            // });
          },
          cancel: function (res) {
          }
        })
      })

      wx.error(function (res) {
        console.error('微信SDK调用出错:', res)
        alert('微信分享配置出错，请检查网络连接或刷新页面')
      })
    })
    .catch(error => {
      console.error('微信分享配置失败:', error)
    })
}
