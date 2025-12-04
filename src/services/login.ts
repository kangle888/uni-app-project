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
    url: '/login/wechat',
    method: 'POST',
    data: params,
  })
}
