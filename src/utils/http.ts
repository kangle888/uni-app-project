import { useRememberPasswordStore } from '@/stores'

/**
 * @description: http请求封装
 * 拦截 request 请求
 * 拦截 uploadFile 文件上传
 *
 *
 * TODO:
 * 1. 非http 开头的请求地址，自动添加前缀
 * 2. 请求超时
 * 3. 添加小程序端请求头标识
 * 4. 添加token 请求头标识
 */
// const baseURL = 'http://183.193.101.170:15000'
const baseURL = 'https://ka.aolc.cn:15000'

// 添加请求前拦截器
const httpInterceptor = {
  // 拦截前触发
  invoke(options: UniApp.RequestOptions) {
    // 1. 非http 开头的请求地址，自动添加前缀
    if (!options.url.startsWith('http')) {
      options.url = baseURL + options.url
    }
    // 2. 请求超时, 默认 10s
    options.timeout = 10000
    // 3. 添加小程序端请求头标识
    options.header = {
      ...options.header,
      'source-client': 'miniapp',
    }
    // 4. 添加token 请求头标识
    const menmberStore = useRememberPasswordStore()
    const token = menmberStore.getToken()
    if (token) {
      options.header = {
        ...options.header,
        TOKEN: token,
      }
    }
  },
}

uni.addInterceptor('request', httpInterceptor)
uni.addInterceptor('uploadFile', httpInterceptor)

/**
 * @description: http请求封装
 * @param {UniApp.RequestOptions} options 请求参数
 * @return {Promise<any>} 返回请求结果
 *
 */
interface Data<T> {
  code: number
  msg: string
  data: T
}

// 添加类型
export const http = <T>(options: UniApp.RequestOptions) => {
  // 1. 返回promise 对象
  return new Promise<Data<T>>((resolve, reject) => {
    // 2. 发送请求
    uni.request({
      ...options,
      success: (res) => {
        if (
          (res.data as Data<T>).code >= 200 &&
          (res.data as Data<T>).code < 300
        ) {
          // 3. 请求成功
          resolve(res.data as Data<T>)
        } else if ((res.data as Data<T>).code === 401) {
          // 4. 401 未授权 -> 清理用户信息 -> 跳转登录页
          const menberStore = useRememberPasswordStore()
          menberStore.clearPassword()
          menberStore.clearToken()
          uni.navigateTo({ url: '/pages/login/login' })
          reject(res) // 标记失败
        } else {
          // 5. 其他错误
          uni.showToast({
            title: (res.data as Data<T>).msg || '请求失败',
            icon: 'none',
          })
          reject(res) // 标记失败
        }
      },
      fail: (err) => {
        // 4. 请求失败
        uni.showToast({
          title: '网络错误',
          icon: 'none',
        })
        reject(err)
      },
    })
  })
}
