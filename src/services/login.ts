import type { LoginParams } from '@/types/login'
import { http } from '@/utils/http'

// /**
//  * 传统登录-用户名+密码
//  * @param data 请求参数
//  */
export const postLoginAPI = (data: LoginParams) => {
  return http({
    method: 'POST',
    url: '/project/login',
    data,
  })
}
