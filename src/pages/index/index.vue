<template>
  <view class="page">
    <view class="card">
      <view class="title">uni-app 模板首页</view>
      <view class="desc">当前已完成：微信登录 + 手机号授权登录流程模板</view>
      <view class="token">token: {{ token || '未登录' }}</view>

      <button class="logout" @click="logout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const token = ref('')

onMounted(() => {
  token.value = uni.getStorageSync('mock_token') || ''
  if (!token.value) {
    uni.reLaunch({ url: '/pages/login/login' })
  }
})

const logout = () => {
  uni.removeStorageSync('mock_token')
  uni.reLaunch({ url: '/pages/login/login' })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 32rpx;
}

.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 36rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 38rpx;
  font-weight: 700;
  color: #1f2d3d;
}

.desc {
  margin-top: 12rpx;
  font-size: 28rpx;
  color: #666;
}

.token {
  margin-top: 20rpx;
  font-size: 24rpx;
  color: #889;
  word-break: break-all;
}

.logout {
  margin-top: 30rpx;
  background: #163172;
  color: #fff;
  border: none;
  border-radius: 12rpx;
}
</style>
