<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useMemberStore } from '@/stores'
import { fetchRooms, type RoomSummary } from '@/services/room'

const memberStore = useMemberStore()
const rooms = ref<RoomSummary[]>([])
const loading = ref(false)

const isLogin = computed(() => Boolean(memberStore.profile?.token))
const userInfo = computed(() => memberStore.profile)
const displayName = computed(() => memberStore.profile?.nickname || '朋友')

const fetchRoomList = async () => {
  if (!isLogin.value) return
  loading.value = true
  try {
    const res = await fetchRooms()
    rooms.value = res.data ?? []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const goToSettings = () => {
  uni.navigateTo({
    url: '/pages/settings/settings',
  })
}

const goToLogin = () => {
  uni.navigateTo({
    url: '/pages/login/login',
  })
}

onShow(() => {
  if (isLogin.value) {
    fetchRoomList()
  }
})
</script>

<template>
  <view class="page">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view v-if="isLogin" class="user-info">
        <view class="avatar">
          <text class="avatar-text">{{ displayName.charAt(0) }}</text>
        </view>
        <view class="user-details">
          <text class="user-name">{{ displayName }}</text>
          <text class="user-id"
            >ID: #{{ userInfo?.id ? String(userInfo.id).slice(-6) : '--' }}</text
          >
        </view>
        <view class="settings-icon" @tap="goToSettings">
          <text class="icon">⚙</text>
        </view>
      </view>
      <view v-else class="login-prompt">
        <text class="prompt-text">登录后使用完整功能</text>
        <button class="login-btn" type="primary" size="mini" @tap="goToLogin">立即登录</button>
      </view>
    </view>

    <!-- 统计信息 -->
    <view v-if="isLogin" class="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{ rooms.length }}</text>
        <text class="stat-label">我的房间</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ loading ? '--' : rooms.length }}</text>
        <text class="stat-label">参与房间</text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-item" @tap="goToSettings">
        <view class="menu-icon">⚙</view>
        <text class="menu-label">设置</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view v-if="isLogin" class="action-section">
      <button
        class="action-btn"
        type="primary"
        @tap="() => uni.switchTab({ url: '/pages/index/index' })"
      >
        查看我的房间
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5fbff 0%, #fefefe 120rpx);
  padding: 32rpx;
}

.user-card {
  background: linear-gradient(135deg, #27ba9b, #1f8ef1);
  border-radius: 32rpx;
  padding: 40rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 24rpx 48rpx rgba(31, 142, 241, 0.25);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid rgba(255, 255, 255, 0.5);
}

.avatar-text {
  font-size: 48rpx;
  font-weight: 600;
  color: #fff;
}

.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
}

.user-id {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.settings-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  font-size: 32rpx;
  color: #fff;
}

.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  padding: 20rpx 0;
}

.prompt-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
}

.login-btn {
  border-radius: 999rpx;
}

.stats-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.stat-value {
  font-size: 44rpx;
  font-weight: 600;
  color: #27ba9b;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: #f0f1f5;
}

.menu-section {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f1f5;
  transition: background 0.2s;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background: #f5f7fb;
}

.menu-icon {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  margin-right: 24rpx;
}

.menu-label {
  flex: 1;
  font-size: 30rpx;
  color: #222;
}

.menu-arrow {
  font-size: 40rpx;
  color: #bbb;
}

.action-section {
  margin-top: 16rpx;
}

.action-btn {
  width: 100%;
  border-radius: 20rpx;
  padding: 28rpx 0;
  font-size: 30rpx;
}
</style>
