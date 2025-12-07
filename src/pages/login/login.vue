<template>
  <view class="login-container">
    <view class="login-header">
      <text class="title">测试环境</text>
      <text class="subtitle">欢迎使用</text>
    </view>

    <view class="login-content">
      <button
        class="login-button"
        open-type="getUserInfo"
        @getuserinfo="handleGetUserInfo"
        :loading="loading"
      >
        <text v-if="!loading">微信快速登录</text>
        <text v-else>登录中...</text>
      </button>

      <view class="tips">
        <text>登录即表示同意《用户协议》和《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { wechatLogin } from '@/services/login'
import { useMemberStore } from '@/stores'
import { joinRoom } from '@/services/room'

const memberStore = useMemberStore()
const loading = ref(false)

// 处理获取用户信息
const handleGetUserInfo = async (e: any) => {
  console.log('获取用户信息事件:', e)
  if (e.detail.errMsg !== 'getUserInfo:ok') {
    uni.showToast({
      title: '需要授权才能登录',
      icon: 'none',
    })
    return
  }

  loading.value = true

  try {
    // 1. 获取微信登录凭证 code
    const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: resolve,
        fail: reject,
      })
    })
    console.log('微信登录凭证:', loginRes)
    if (!loginRes.code) {
      throw new Error('获取登录凭证失败')
    }

    // 2. 调用后端登录接口
    const res = await wechatLogin({
      code: loginRes.code,
      userInfo: e.detail.userInfo,
    })

    // 3. 保存用户信息到 store
    if (res.code === 200 && res.data) {
      memberStore.setProfile({
        id: res.data.id,
        openid: res.data.openid,
        nickname: res.data.nickname,
        avatar_url: res.data.avatar_url,
        phone: res.data.phone,
        token: res.data.token,
      })

      uni.showToast({
        title: '登录成功',
        icon: 'success',
      })

      // 4. 检查是否有待加入的房间邀请码
      const pendingCode = memberStore.pendingInviteCode
      if (pendingCode) {
        // 有待加入的房间，自动加入
        try {
          await joinRoom({ inviteCode: pendingCode })
          uni.showToast({
            title: '登录成功，已自动加入房间',
            icon: 'success',
          })
          memberStore.clearPendingInviteCode()
        } catch (error: any) {
          console.error('自动加入房间失败:', error)
          // 加入失败不影响登录，清除待加入码
          memberStore.clearPendingInviteCode()
        }
      } else {
        uni.showToast({
          title: '登录成功',
          icon: 'success',
        })
      }

      // 5. 跳转到首页
      setTimeout(
        () => {
          uni.switchTab({
            url: '/pages/index/index',
          })
        },
        pendingCode ? 2000 : 1500,
      )
    } else {
      throw new Error(res.message || '登录失败')
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    uni.showToast({
      title: error.message || '登录失败，请重试',
      icon: 'none',
      duration: 2000,
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.login-header {
  text-align: center;
  margin-bottom: 120rpx;

  .title {
    display: block;
    font-size: 64rpx;
    font-weight: bold;
    color: #ffffff;
    margin-bottom: 20rpx;
  }

  .subtitle {
    display: block;
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

.login-content {
  width: 100%;
  max-width: 600rpx;

  .login-button {
    width: 100%;
    height: 88rpx;
    background: #ffffff;
    color: #667eea;
    border-radius: 44rpx;
    font-size: 32rpx;
    font-weight: 500;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
    transition: all 0.3s;

    &:active {
      transform: scale(0.98);
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
    }
  }

  .tips {
    margin-top: 40rpx;
    text-align: center;

    text {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
    }
  }
}
</style>
