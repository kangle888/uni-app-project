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
 * 手机号密码登录
 */
export const phoneLogin = (data: any) => {
  return http<any>({
    url: '/auth/login',
    method: 'POST',
    data,
  })
}

/**
 * 手机号注册
 */
export const phoneRegister = (data: any) => {
  return http<any>({
    url: '/auth/register',
    method: 'POST',
    data,
  })
}
