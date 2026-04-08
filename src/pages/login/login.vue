<template>
  <view class="login-page">
    <view class="card">
      <view class="title">微信快捷登录</view>
      <view class="desc">先获取微信身份，再授权手机号完成登录</view>

      <button
        class="btn btn-primary"
        :disabled="loading"
        @click="handleWxLogin"
      >
        {{ loading ? '登录中...' : '1. 微信登录' }}
      </button>

      <button
        class="btn btn-phone"
        open-type="getPhoneNumber"
        :disabled="!code || loading"
        @getphonenumber="handleGetPhoneNumber"
      >
        2. 授权手机号登录
      </button>

      <view class="tips">
        <text>code: {{ code ? '已获取' : '未获取' }}</text>
        <text class="dot">·</text>
        <text>手机号授权: {{ phoneAuthorized ? '已授权' : '未授权' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const loading = ref(false)
const code = ref('')
const phoneAuthorized = ref(false)

const handleWxLogin = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const loginRes = await uni.login({ provider: 'weixin' })
    if (!loginRes.code) {
      uni.showToast({ title: '获取 code 失败', icon: 'none' })
      return
    }
    code.value = loginRes.code

    // TODO: 这里调用你的后端接口，换取业务 token
    // const res = await loginByWxCodeAPI({ code: loginRes.code })
    // tokenStore.setToken(res.data.token)

    uni.showToast({ title: '微信登录成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: '微信登录失败', icon: 'none' })
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleGetPhoneNumber = async (e: any) => {
  if (!code.value) {
    uni.showToast({ title: '请先完成微信登录', icon: 'none' })
    return
  }

  if (e?.detail?.errMsg !== 'getPhoneNumber:ok') {
    uni.showToast({ title: '你已取消手机号授权', icon: 'none' })
    return
  }

  try {
    const { encryptedData, iv } = e.detail

    // TODO: 这里调用后端接口，用 code + encryptedData + iv 换取手机号并完成登录
    // const res = await loginByPhoneAuthAPI({
    //   code: code.value,
    //   encryptedData,
    //   iv,
    // })
    // tokenStore.setToken(res.data.token)

    phoneAuthorized.value = true
    uni.setStorageSync('mock_token', `token_${Date.now()}`)
    uni.showToast({ title: '登录成功', icon: 'success' })

    setTimeout(() => {
      uni.reLaunch({ url: '/pages/index/index' })
    }, 300)

    console.log('encryptedData:', encryptedData)
    console.log('iv:', iv)
  } catch (error) {
    uni.showToast({ title: '手机号登录失败', icon: 'none' })
    console.error(error)
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #eef4ff 0%, #f7f8fa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
}

.card {
  width: 100%;
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 8rpx 28rpx rgba(22, 49, 114, 0.08);
}

.title {
  font-size: 42rpx;
  font-weight: 700;
  color: #1f2d3d;
}

.desc {
  margin-top: 12rpx;
  margin-bottom: 36rpx;
  font-size: 26rpx;
  color: #6b7280;
}

.btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 14rpx;
  border: none;
  font-size: 30rpx;
  margin-bottom: 20rpx;
}

.btn-primary {
  color: #fff;
  background: #163172;
}

.btn-phone {
  color: #163172;
  background: #e9efff;
}

.tips {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #8b9099;
  display: flex;
  align-items: center;
}

.dot {
  margin: 0 10rpx;
}
</style>
