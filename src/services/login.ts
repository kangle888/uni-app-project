import { http } from '@/utils/http'

/**
 * 微信登录接口
 */
export interface WechatLoginParams {
  code: string
  userInfo?: {
    nickName?: string
    avatarUrl?: string
    gender?: number
    country?: string
    province?: string
    city?: string
  }
}

export interface WechatLoginResult {
  id: number
  openid: string
  nickname: string | null
  avatar_url: string | null
  phone: string | null
  token: string
}

/**
 * 微信小程序登录
 */
export const wechatLogin = (params: WechatLoginParams) => {
  return http<WechatLoginResult>({
    url: '/auth/wechat',
    method: 'POST',
    data: params,
  })
}

/**
 * 用户名密码登录
 */
export const userLogin = (data: { username: string; password: string }) => {
  return http<any>({
    url: '/sysUser/login',
    method: 'POST',
    data,
  })
}

/**
 * 用户名注册
 */
export const userRegister = (data: { username: string; password: string }) => {
  return http<any>({
    url: '/sysUser/register',
    method: 'POST',
    data,
  })
}

/**
 *  获取当前登录用户信息
 */
export const getCurrentUserInfo = () => {
  return http<any>({
    url: '/sysUser/getCurrentUserInfo',
    method: 'GET',
  })
}

/**
 * 更新用户信息
 */
export const updateUserInfo = (data: any) => {
  return http<any>({
    url: '/sysUser/updateUser',
    method: 'POST',
    data,
  })
}

// 更新密码 /demo/sysUser/updatePassword
export const updatePassword = (data: any) => {
  return http<any>({
    url: '/sysUser/updatePassword',
    method: 'POST',
    data,
  })
}

//重置密码 /demo/sysUser/resetPassword
export const resetPassword = (data: { userId: string }) => {
  return http<any>({
    url: '/sysUser/resetPassword',
    method: 'GET',
    data,
  })
}
