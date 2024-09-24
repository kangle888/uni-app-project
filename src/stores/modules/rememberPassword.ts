import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义 Store
export const useRememberPasswordStore = defineStore(
  'accountAndPassword',
  () => {
    // 密码信息
    const profile = ref<any>()

    // 保存密码信息，登录时使用
    const setPassword = (val: any) => {
      profile.value = val
    }

    // 清理密码信息，退出时使用
    const clearPassword = () => {
      profile.value = undefined
    }

    // 获取密码存储状态
    const getRememberPasswordStaus = () => {
      return profile.value
    }

    // 记得 return
    return {
      profile,
      setPassword,
      clearPassword,
      getRememberPasswordStaus,
    }
  },
  // TODO: 持久化
  {
    // 这个是网页端配置
    // persist: true,
    // 小程序端配置
    persist: {
      storage: {
        getItem: (key: string) => {
          return uni.getStorageSync(key)
        },
        setItem: (key: string, value: any) => {
          uni.setStorageSync(key, value)
        },
      },
    },
  },
)