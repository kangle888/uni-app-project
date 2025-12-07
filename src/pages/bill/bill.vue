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

const selectedRoom = computed(() => {
  return rooms.value.find((r) => r.id === selectedRoomId.value)
})

const transactions = computed(() => {
  if (!selectedRoomId.value || !roomDetails.value.has(selectedRoomId.value)) {
    return []
  }
  const detail = roomDetails.value.get(selectedRoomId.value)
  return detail?.transactions || []
})

const members = computed(() => {
  if (!selectedRoomId.value || !roomDetails.value.has(selectedRoomId.value)) {
    return []
  }
  const detail = roomDetails.value.get(selectedRoomId.value)
  return detail?.members || []
})

const myMemberId = computed(() => {
  if (!memberStore.profile?.id) return ''
  const me = members.value.find((member: any) => member.user_id === memberStore.profile?.id)
  return me?.id ?? ''
})

const memberNameMap = computed(() => {
  const map = new Map<string, string>()
  members.value.forEach((member: any, index: number) => {
    const order = index + 1
    const userIdText = member.user_id ? `#${String(member.user_id).slice(-4)}` : ''
    map.set(member.id, `成员${order} ${userIdText}`)
  })
  return map
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

const formatTime = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`
}

const formatAmount = (value: string | number) => {
  const num = Number(value)
  if (Number.isNaN(num)) return value
  return num.toFixed(2)
}

const transactionDirection = (txn: RoomTransaction) => {
  if (txn.to_member_id === myMemberId.value) return 'income'
  if (txn.from_member_id === myMemberId.value) return 'expense'
  return 'neutral'
}

const directionPrefix = (txn: RoomTransaction) => {
  const type = transactionDirection(txn)
  if (type === 'income') return '+'
  if (type === 'expense') return '-'
  return ''
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
      <text class="tip-text">请先登录查看账单记录</text>
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

      <!-- 账单列表 -->
      <view class="bill-card">
        <view class="card-header">
          <text class="card-title">交易记录</text>
          <text class="card-count">共 {{ transactions.length }} 条</text>
        </view>

        <view v-if="transactions.length" class="bill-list">
          <view class="bill-item" v-for="txn in transactions" :key="txn.id">
            <view class="bill-main">
              <view class="bill-info">
                <text class="bill-title">
                  {{ memberNameMap.get(txn.from_member_id) || '未知' }} →
                  {{ memberNameMap.get(txn.to_member_id) || '未知' }}
                </text>
                <text class="bill-time">{{ formatTime(txn.created_at) }}</text>
              </view>
              <text
                class="bill-amount"
                :class="{
                  income: transactionDirection(txn) === 'income',
                  expense: transactionDirection(txn) === 'expense',
                  neutral: transactionDirection(txn) === 'neutral',
                }"
              >
                {{ directionPrefix(txn) }}¥{{ formatAmount(txn.amount) }}
              </text>
            </view>
            <view v-if="txn.remark" class="bill-remark">
              <text>{{ txn.remark }}</text>
            </view>
          </view>
        </view>

        <view v-else class="empty-state">
          <image class="empty-img" src="/static/images/blank.png" mode="widthFix" />
          <text class="empty-text">暂无交易记录</text>
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

.bill-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f0f1f5;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #222;
}

.card-count {
  font-size: 24rpx;
  color: #999;
}

.bill-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.bill-item {
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f0f1f5;
}

.bill-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.bill-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12rpx;
}

.bill-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.bill-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #222;
}

.bill-time {
  font-size: 24rpx;
  color: #999;
}

.bill-amount {
  font-size: 32rpx;
  font-weight: 600;
}

.bill-amount.income {
  color: #27ba9b;
}

.bill-amount.expense {
  color: #f56c6c;
}

.bill-amount.neutral {
  color: #666;
}

.bill-remark {
  padding: 12rpx 16rpx;
  background: #f5f7fb;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #666;
}

.empty-state {
  padding: 80rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  text-align: center;
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
