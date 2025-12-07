<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { useMemberStore } from '@/stores'
import {
  fetchRooms,
  fetchRoomDetail,
  type RoomSummary,
  type RoomTransaction,
} from '@/services/room'

const memberStore = useMemberStore()
const rooms = ref<RoomSummary[]>([])
const loading = ref(false)
const selectedRoomId = ref<string>('')
const roomDetails = ref<Map<string, any>>(new Map())

const isLogin = computed(() => Boolean(memberStore.profile?.token))

// 计算统计数据
const statistics = computed(() => {
  if (!selectedRoomId.value || !roomDetails.value.has(selectedRoomId.value)) {
    return {
      totalRooms: rooms.value.length,
      totalMembers: 0,
      totalTransactions: 0,
      totalAmount: 0,
      myBalance: 0,
    }
  }

  const detail = roomDetails.value.get(selectedRoomId.value)
  const members = detail?.members || []
  const transactions = detail?.transactions || []

  const myMember = members.find((m: any) => m.user_id === memberStore.profile?.id)

  const totalAmount = transactions.reduce(
    (sum: number, txn: RoomTransaction) => sum + Number(txn.amount),
    0,
  )

  return {
    totalRooms: rooms.value.length,
    totalMembers: members.length,
    totalTransactions: transactions.length,
    totalAmount,
    myBalance: myMember ? Number(myMember.balance) : 0,
  }
})

const selectedRoom = computed(() => {
  return rooms.value.find((r) => r.id === selectedRoomId.value)
})

const fetchRoomList = async () => {
  if (!isLogin.value) return
  loading.value = true
  try {
    const res = await fetchRooms()
    rooms.value = res.data ?? []
    if (rooms.value.length > 0 && !selectedRoomId.value) {
      selectedRoomId.value = rooms.value[0].id
      await fetchRoomDetailData(selectedRoomId.value)
    }
  } catch (error) {
    console.error(error)
    uni.showToast({ title: '获取房间失败', icon: 'none' })
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

const fetchRoomDetailData = async (roomId: string) => {
  if (!roomId) return
  try {
    const res = await fetchRoomDetail(roomId)
    roomDetails.value.set(roomId, res.data)
  } catch (error) {
    console.error(error)
  }
}

const onRoomChange = (event: any) => {
  const index = Number(event.detail.value)
  const room = rooms.value[index]
  if (room) {
    selectedRoomId.value = room.id
    if (!roomDetails.value.has(room.id)) {
      fetchRoomDetailData(room.id)
    }
  }
}

const formatAmount = (value: number) => {
  return value.toFixed(2)
}

const goRoomDetail = () => {
  if (selectedRoomId.value) {
    uni.navigateTo({
      url: `/pages/room/detail?roomId=${selectedRoomId.value}`,
    })
  }
}

onShow(() => {
  if (isLogin.value) {
    fetchRoomList()
  }
})

onPullDownRefresh(() => {
  fetchRoomList()
  if (selectedRoomId.value) {
    fetchRoomDetailData(selectedRoomId.value)
  }
})
</script>

<template>
  <view class="page">
    <view v-if="!isLogin" class="login-tip">
      <text class="tip-text">请先登录查看统计信息</text>
      <button
        class="login-btn"
        type="primary"
        size="mini"
        @tap="() => uni.navigateTo({ url: '/pages/login/login' })"
      >
        去登录
      </button>
    </view>

    <view v-else-if="loading" class="state">
      <uni-load-more status="loading" iconType="circle" />
    </view>

    <view v-else-if="rooms.length === 0" class="state empty">
      <image class="empty-img" src="/static/images/blank.png" mode="widthFix" />
      <text class="empty-text">暂无房间数据</text>
    </view>

    <view v-else class="content">
      <!-- 房间选择器 -->
      <view class="room-selector-card">
        <text class="label">选择房间</text>
        <picker
          mode="selector"
          :range="rooms"
          range-key="name"
          :value="rooms.findIndex((r) => r.id === selectedRoomId)"
          @change="onRoomChange"
        >
          <view class="picker-view">
            <text class="picker-text">{{ selectedRoom?.name || '请选择房间' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>

      <!-- 统计卡片 -->
      <view class="stats-grid">
        <view class="stat-card">
          <text class="stat-value">{{ statistics.totalRooms }}</text>
          <text class="stat-label">房间数</text>
        </view>
        <view class="stat-card">
          <text class="stat-value">{{ statistics.totalMembers }}</text>
          <text class="stat-label">成员数</text>
        </view>
        <view class="stat-card">
          <text class="stat-value">{{ statistics.totalTransactions }}</text>
          <text class="stat-label">交易数</text>
        </view>
        <view class="stat-card highlight">
          <text class="stat-value">¥{{ formatAmount(statistics.totalAmount) }}</text>
          <text class="stat-label">总金额</text>
        </view>
      </view>

      <!-- 我的余额 -->
      <view class="balance-card">
        <view class="balance-header">
          <text class="balance-title">我的余额</text>
          <text class="balance-subtitle">{{ selectedRoom?.name || '' }}</text>
        </view>
        <view
          class="balance-amount"
          :class="{ positive: statistics.myBalance >= 0, negative: statistics.myBalance < 0 }"
        >
          <text class="balance-symbol">{{ statistics.myBalance >= 0 ? '+' : '' }}</text>
          <text class="balance-value">¥{{ formatAmount(Math.abs(statistics.myBalance)) }}</text>
        </view>
        <view class="balance-tip">
          <text>{{ statistics.myBalance >= 0 ? '应收金额' : '应付金额' }}</text>
        </view>
      </view>

      <!-- 快捷操作 -->
      <view class="action-card">
        <button class="action-btn" type="primary" @tap="goRoomDetail">查看房间详情</button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 32rpx;
  background: linear-gradient(180deg, #f5fbff 0%, #fefefe 120rpx);
}

.login-tip {
  margin: 120rpx 32rpx;
  padding: 40rpx;
  border-radius: 24rpx;
  background: #fffbe6;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  text-align: center;
}

.tip-text {
  font-size: 28rpx;
  color: #8c6c1a;
}

.state {
  margin: 120rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.state.empty {
  flex-direction: column;
  gap: 24rpx;
  text-align: center;
  color: #888;
}

.empty-img {
  width: 320rpx;
  height: 320rpx;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.room-selector-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.picker-view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: #f5f7fb;
  border-radius: 16rpx;
}

.picker-text {
  font-size: 30rpx;
  font-weight: 500;
  color: #222;
}

.picker-arrow {
  font-size: 40rpx;
  color: #bbb;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.stat-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  text-align: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.stat-card.highlight {
  background: linear-gradient(135deg, #27ba9b, #1f8ef1);
  color: #fff;
}

.stat-value {
  display: block;
  font-size: 44rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  opacity: 0.8;
}

.balance-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  text-align: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.balance-header {
  margin-bottom: 32rpx;
}

.balance-title {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.balance-subtitle {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 16rpx;
}

.balance-symbol {
  font-size: 48rpx;
  font-weight: 600;
}

.balance-value {
  font-size: 64rpx;
  font-weight: 600;
}

.balance-amount.positive {
  color: #27ba9b;
}

.balance-amount.negative {
  color: #f56c6c;
}

.balance-tip {
  font-size: 24rpx;
  color: #999;
}

.action-card {
  margin-top: 8rpx;
}

.action-btn {
  width: 100%;
  border-radius: 20rpx;
  padding: 28rpx 0;
  font-size: 30rpx;
}
</style>
