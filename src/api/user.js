import request from '@/utils/request'

export function login (data) {
  return request({
    url: '/expert/loginnormal',
    method: 'post',
    data: {
      expertNo: data.username,
      expertPwd: data.password,
      type: '移动端'
    }
    // data: JSON.stringify(data)
  })
}

export function getMeetingList (data) {
  return request({
    url: '/testapi/MeetingList',
    method: 'post',
    data
  })
}

export function getAdvertising (data) {
  return request({
    url: '/testapi/AdBannerList',
    method: 'post',
    data
  })
}
export function getPosterList (data) {
  return request({
    url: '/testapi/PosterList',
    method: 'post',
    data
  })
}

export function getCategoryList (data) {
  return request({
    url: '/testapi/CategoryList',
    method: 'post',
    data
  })
}
export function JssdkConfig (data) {
  return request({
    url: '/testapi/JssdkConfig',
    method: 'post',
    data
  })
}

export function playerstatusupd (data) {
  return request({
    url: '/aipic/playerstatusupd',
    method: 'post',
    data
  })
}

export function picresult (data) {
  return request({
    url: '/aipic/picresult',
    method: 'post',
    data
  })
}

export function expertsignin (data) {
  return request({
    url: '/expert/expertsignin',
    method: 'post',
    data
  })
}

export function expertpasswordupd (data) {
  return request({
    url: '/expert/expertpasswordupd',
    method: 'post',
    data
  })
}

export function expertcommitment (data) {
  return request({
    url: '/expert/commitment',
    method: 'post',
    data
  })
}

export function expertconfirm (data) {
  return request({
    url: '/expert/expertconfirm',
    method: 'post',
    data
  })
}

export function getmatchinfolist (data) {
  return request({
    url: '/expert/usermatchinfolist',
    method: 'post',
    data
  })
}

export function goEmpower (data) {
  return request({
    url: `/expert/getlogininfomob?code=${data.code}`,
    method: 'get'
  })
}

export function wxoauth (data) {
  return request({
    url: `/aipic/wxoauth?code=${data}`,
    method: 'get'
  })
}

export function getInfo (token) {
  return request({
    url: '/user/info',
    method: 'get',
    params: { token }
  })
}

export function logout () {
  return request({
    url: '/user/logout',
    method: 'post'
  })
}
