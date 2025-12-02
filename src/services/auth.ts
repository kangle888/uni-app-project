import { http } from '@/utils/http'

// 会员信息类型（按需补充字段）
export interface LoginResult {
  token: string
  // 下面这些字段根据你后端实际返回再逐步补充
  [key: string]: any
}

// 微信小程序：手机号一键登录
// 这里的 url 和参数结构要跟你后端约定保持一致
export const postLoginByWxPhone = (data: any) => {
  return http<LoginResult>({
    method: 'POST',
    url: '/login/wxMin/simple',
    data,
  })
}
