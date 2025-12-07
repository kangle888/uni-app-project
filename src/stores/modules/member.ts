import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义 Store
export const useMemberStore = defineStore(
  'member',
  () => {
    // 会员信息
    const profile = ref<any>()
    // 待加入的房间邀请码（扫码进入但未登录时保存）
    const pendingInviteCode = ref<string>('')

    // 保存会员信息，登录时使用
    const setProfile = (val: any) => {
      profile.value = val
    }

    // 清理会员信息，退出时使用
    const clearProfile = () => {
      profile.value = undefined
    }

    // 设置待加入的邀请码
    const setPendingInviteCode = (code: string) => {
      pendingInviteCode.value = code
    }

    // 清除待加入的邀请码
    const clearPendingInviteCode = () => {
      pendingInviteCode.value = ''
    }

    // 记得 return
    return {
      profile,
      pendingInviteCode,
      setProfile,
      clearProfile,
      setPendingInviteCode,
      clearPendingInviteCode,
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
