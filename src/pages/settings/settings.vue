<script setup lang="ts">
import { computed } from 'vue'
import { useMemberStore } from '@/stores'

const memberStore = useMemberStore()

const isLogin = computed(() => Boolean(memberStore.profile?.token))
const userInfo = computed(() => memberStore.profile)

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        memberStore.clearProfile()
        uni.reLaunch({
          url: '/pages/login/login',
        })
      }
    },
  })
}

const goToAbout = () => {
  uni.showModal({
    title: '关于',
    content: '房间账本小程序\n版本 1.0.0\n\n用于管理房间成员之间的账务记录',
    showCancel: false,
  })
}

const clearCache = () => {
  uni.showModal({
    title: '提示',
    content: '确定要清除缓存吗？',
    success: (res) => {
      if (res.confirm) {
        // 这里可以添加清除缓存的逻辑
        uni.showToast({
          title: '缓存已清除',
          icon: 'success',
        })
      }
    },
  })
}
</script>

<template>
  <view class="page">
    <view class="settings-list">
      <!-- 用户信息 -->
      <view class="settings-section">
        <view class="section-title">账户信息</view>
        <view class="settings-item">
          <text class="item-label">登录状态</text>
          <text class="item-value">{{ isLogin ? '已登录' : '未登录' }}</text>
        </view>
        <view v-if="isLogin && userInfo?.nickname" class="settings-item">
          <text class="item-label">昵称</text>
          <text class="item-value">{{ userInfo.nickname }}</text>
        </view>
        <view v-if="isLogin && userInfo?.id" class="settings-item">
          <text class="item-label">用户ID</text>
          <text class="item-value">#{{ String(userInfo.id).slice(-6) }}</text>
        </view>
      </view>

      <!-- 通用设置 -->
      <view class="settings-section">
        <view class="section-title">通用设置</view>
        <view class="settings-item clickable" @tap="clearCache">
          <text class="item-label">清除缓存</text>
          <text class="item-arrow">›</text>
        </view>
      </view>

      <!-- 关于 -->
      <view class="settings-section">
        <view class="section-title">关于</view>
        <view class="settings-item clickable" @tap="goToAbout">
          <text class="item-label">关于我们</text>
          <text class="item-arrow">›</text>
        </view>
      </view>

      <!-- 退出登录 -->
      <view v-if="isLogin" class="logout-section">
        <button class="logout-btn" type="warn" @tap="handleLogout">退出登录</button>
      </view>

      <!-- 未登录提示 -->
      <view v-else class="login-prompt">
        <text class="prompt-text">请先登录使用完整功能</text>
        <button
          class="login-btn"
          type="primary"
          @tap="() => uni.navigateTo({ url: '/pages/login/login' })"
        >
          去登录
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f7fb;
  padding: 32rpx;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.settings-section {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.section-title {
  padding: 24rpx 32rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #666;
  background: #f8f9fa;
  border-bottom: 1rpx solid #f0f1f5;
}

.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f1f5;
}

.settings-item:last-child {
  border-bottom: none;
}

.settings-item.clickable {
  background: #fff;
  transition: background 0.2s;
}

.settings-item.clickable:active {
  background: #f5f7fb;
}

.item-label {
  font-size: 30rpx;
  color: #222;
}

.item-value {
  font-size: 28rpx;
  color: #666;
}

.item-arrow {
  font-size: 40rpx;
  color: #bbb;
}

.logout-section {
  margin-top: 16rpx;
}

.logout-btn {
  width: 100%;
  border-radius: 20rpx;
  padding: 28rpx 0;
  font-size: 30rpx;
}

.login-prompt {
  background: #fff;
  border-radius: 24rpx;
  padding: 60rpx 32rpx;
  text-align: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.prompt-text {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 32rpx;
}

.login-btn {
  min-width: 200rpx;
  border-radius: 20rpx;
}
</style>
