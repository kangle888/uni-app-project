import { useMemberStore } from '@/stores'

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
// 根据环境配置 baseURL，开发环境可以改为你的后端地址
// 使用 import.meta.env.MODE 判断环境（已添加类型声明）http://192.168.1.2:10000
const baseURL =
  import.meta.env.MODE === 'development'
    ? 'https://xklandlxy.art' // 本地开发用 Node 本地端口
    : 'https://xklandlxy.art' // 生产环境用 HTTPS 域名

// 添加请求前拦截器
const httpInterceptor = {
  // 拦截前触发
  invoke(options: UniApp.RequestOptions | UniApp.UploadFileOption) {
    // 1. 非http 开头的请求地址，自动添加前缀
    if (!options.url.startsWith('http')) {
      // 如果 URL 不是以 /api 开头，则添加 /api 前缀
      if (!options.url.startsWith('/api')) {
        options.url = '/api' + options.url
      }
      options.url = baseURL + options.url
    }
    console.log('请求地址：', options.url)
    // 判断是否是文件上传请求
    const isUploadFile = 'filePath' in options

    // 2. 请求超时, 默认 10s（uploadFile 可能不支持 timeout）
    if ('timeout' in options) {
      options.timeout = 10000
    }

    // 3. 初始化 header
    if (!options.header) {
      options.header = {}
    }

    // 4. 添加小程序端请求头标识和 token
    const menberStore = useMemberStore()
    const token = menberStore.profile?.token

    // 对于 request 请求，设置 Content-Type；对于 uploadFile，不设置（让系统自动处理）
    if (!isUploadFile) {
      options.header['Content-Type'] = 'application/json'
    }

    options.header['source-client'] = 'miniapp'

    // 5. 添加token 请求头标识
    if (token) {
      options.header['Authorization'] = `Bearer ${token}`
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
  message: string
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
        const responseData = res.data as Data<T>

        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 检查业务状态码
          if (responseData.code === 200) {
            // 3. 请求成功
            resolve(responseData)
          } else {
            // 业务逻辑错误
            uni.showToast({
              title: responseData.message || '请求失败',
              icon: 'none',
            })
            reject(res)
          }
        } else if (res.statusCode === 401) {
          // 4. 401 未授权 -> 清理用户信息 -> 跳转登录页
          const menberStore = useMemberStore()
          menberStore.clearProfile()
          uni.navigateTo({ url: '/pages/login/login' })
          reject(res) // 标记失败
        } else {
          // 5. 其他HTTP错误
          uni.showToast({
            title: responseData?.message || '请求失败',
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
