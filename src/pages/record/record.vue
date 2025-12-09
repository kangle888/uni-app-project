<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { useMemberStore } from '@/stores'
import {
  createTransfer,
  fetchRooms,
  fetchRoomDetail,
  type RoomDetail,
  type RoomMember,
  type RoomSummary,
} from '@/services/room'

const memberStore = useMemberStore()
const rooms = ref<RoomSummary[]>([])
const selectedRoomId = ref<string>('')
const detail = ref<RoomDetail | null>(null)
const loading = ref(false)
const submitting = ref(false)
const transferForm = reactive({
  fromMemberId: '',
  toMemberId: '',
  amount: '',
  remark: '',
})
const quickAmount = ref('')
const transferPopupRef = ref<any>()
const transferTargetId = ref('')

const isLogin = computed(() => Boolean(memberStore.profile?.token))
const selectedRoom = computed(() => rooms.value.find((r) => r.id === selectedRoomId.value))

const members = computed(() => detail.value?.members ?? [])
const myMemberId = computed(() => {
  if (!memberStore.profile?.id) return ''
  const me = members.value.find((member) => member.user_id === memberStore.profile?.id)
  return me?.id ?? ''
})

const myBalance = computed(() => {
  const me = members.value.find((member) => member.id === myMemberId.value)
  return me ? Number(me.balance) : 0
})

const memberLabel = (member: RoomMember, index: number) => {
  const order = index + 1
  const userIdText = member.user_id ? `#${String(member.user_id).slice(-4)}` : ''
  return `成员${order} ${userIdText}`
}

const sortedMembers = computed(() =>
  [...members.value].sort((a, b) => Number(b.balance) - Number(a.balance)),
)

const myRank = computed(() => {
  const idx = sortedMembers.value.findIndex((m) => m.id === myMemberId.value)
  return idx === -1 ? '-' : idx + 1
})

const baseURL =
  import.meta.env.MODE === 'development' ? 'http://localhost:10000' : 'https://xklandlxy.art'
const normalizeUrl = (url?: string | null) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return `${baseURL}${url}`
  return `${baseURL}/${url}`
}

const memberCards = computed(() =>
  sortedMembers.value.map((member, idx) => {
    const score = Number(member.balance)
    const isMe = member.id === myMemberId.value
    const displayName = member.nickname || memberLabel(member, idx)
    return {
      id: member.id,
      name: displayName,
      avatar: normalizeUrl(member.avatar_url),
      score,
      tag: isMe ? '我' : '',
    }
  }),
)

const memberNameMap = computed(() => {
  const map = new Map<string, string>()
  members.value.forEach((member, index) => {
    map.set(member.id, memberLabel(member, index))
  })
  return map
})

const transferTargets = computed(() =>
  members.value
    .filter((member) => member.id !== transferForm.fromMemberId)
    .map((member) => {
      const index = members.value.findIndex((item) => item.id === member.id)
      return {
        id: member.id,
        label: memberLabel(member, index),
      }
    }),
)

const targetIndex = computed(() =>
  transferTargets.value.findIndex((option) => option.id === transferForm.toMemberId),
)

const targetLabel = computed(
  () => transferTargets.value[targetIndex.value]?.label || '选择转入成员',
)

const formatAmount = (value: string | number) => {
  const num = Number(value)
  if (Number.isNaN(num)) return value
  return num.toFixed(2)
}

const fetchRoomList = async () => {
  if (!isLogin.value) return
  loading.value = true
  try {
    const res = await fetchRooms()
    rooms.value = res.data ?? []
    // 如果有房间且未选择，选择第一个
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
    detail.value = res.data
  } catch (error) {
    console.error(error)
    uni.showToast({ title: '加载房间详情失败', icon: 'none' })
  }
}

const onRoomChange = (event: any) => {
  const index = Number(event.detail.value)
  const room = rooms.value[index]
  if (room) {
    selectedRoomId.value = room.id
    fetchRoomDetailData(room.id)
  }
}

const onTargetChange = (event: any) => {
  const index = Number(event.detail?.value ?? -1)
  const target = transferTargets.value[index]
  if (target) {
    transferForm.toMemberId = target.id
  }
}

const submitTransfer = async () => {
  if (!selectedRoomId.value) {
    uni.showToast({ title: '请先选择房间', icon: 'none' })
    return
  }
  if (!transferForm.fromMemberId) {
    uni.showToast({ title: '您尚未加入房间', icon: 'none' })
    return
  }
  if (!transferForm.toMemberId) {
    uni.showToast({ title: '请选择转入成员', icon: 'none' })
    return
  }
  const amountNumber = Number(transferForm.amount)
  if (!amountNumber || amountNumber <= 0) {
    uni.showToast({ title: '请输入正确的金额', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await createTransfer(selectedRoomId.value, {
      fromMemberId: transferForm.fromMemberId,
      toMemberId: transferForm.toMemberId,
      amount: Number(amountNumber.toFixed(2)),
      remark: transferForm.remark.trim(),
    })
    uni.showToast({ title: '记账成功', icon: 'success' })
    transferForm.amount = ''
    transferForm.remark = ''
    await fetchRoomDetailData(selectedRoomId.value)
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}

const openQuickTransfer = (memberId: string) => {
  if (!myMemberId.value) {
    uni.showToast({ title: '您尚未加入房间', icon: 'none' })
    return
  }
  if (memberId === myMemberId.value) {
    uni.showToast({ title: '不能给自己转账', icon: 'none' })
    return
  }
  transferTargetId.value = memberId
  quickAmount.value = ''
  transferPopupRef.value?.open?.('center')
}

const submitQuickTransfer = async () => {
  const amountNumber = Number(quickAmount.value)
  if (!amountNumber || amountNumber <= 0) {
    uni.showToast({ title: '请输入正确的金额', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await createTransfer(selectedRoomId.value, {
      fromMemberId: myMemberId.value,
      toMemberId: transferTargetId.value,
      amount: Number(amountNumber.toFixed(2)),
      remark: '',
    })
    uni.showToast({ title: '转账成功', icon: 'success' })
    transferPopupRef.value?.close?.()
    quickAmount.value = ''
    await fetchRoomDetailData(selectedRoomId.value)
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}

const goToRoomDetail = () => {
  if (selectedRoomId.value) {
    uni.navigateTo({
      url: `/pages/room/detail?roomId=${selectedRoomId.value}`,
    })
  }
}

// 引导登录/回首页
const goLogin = () => {
  uni.navigateTo({ url: '/pages/login/login' })
}

const goHome = () => {
  uni.switchTab({ url: '/pages/index/index' })
}

watch(
  () => myMemberId.value,
  (value) => {
    transferForm.fromMemberId = value
    if (value && transferForm.toMemberId === value) {
      transferForm.toMemberId = ''
    }
  },
  { immediate: true },
)

watch(
  () => transferTargets.value,
  (options) => {
    if (!options.length) {
      transferForm.toMemberId = ''
      return
    }
    if (!options.find((item) => item.id === transferForm.toMemberId)) {
      transferForm.toMemberId = options[0].id
    }
  },
  { immediate: true },
)

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
      <text class="tip-text">请先登录使用记账功能</text>
      <button class="login-btn" type="primary" size="mini" @tap="goLogin">去登录</button>
    </view>

    <view v-else-if="loading && !detail" class="state">
      <uni-load-more status="loading" iconType="circle" />
    </view>

    <view v-else-if="rooms.length === 0" class="state empty">
      <image class="empty-img" src="/static/images/blank.png" mode="widthFix" />
      <text class="empty-text">暂无房间，请先创建或加入房间</text>
      <button class="action-btn" type="primary" size="mini" @tap="goHome">去首页</button>
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

      <!-- 房间信息卡片 -->
      <view v-if="detail" class="info-card">
        <view class="info-top">
          <view class="room-meta">
            <text class="room-name">{{ detail.room.name }}</text>
            <text class="room-code">邀请码：{{ detail.room.invite_code }}</text>
          </view>
          <view class="room-actions">
            <button size="mini" class="ghost-btn" @tap="goToRoomDetail">房间详情</button>
          </view>
        </view>
        <view class="score-card" :class="{ positive: myBalance >= 0, negative: myBalance < 0 }">
          <view class="score-left">
            <text class="score-label">我的积分</text>
            <text class="score-value"
              >{{ myBalance >= 0 ? '+' : '-' }}{{ formatAmount(Math.abs(myBalance)) }}</text
            >
            <view class="score-sub">
              <text>我的排名：{{ myRank }}</text>
              <text>成员数：{{ members.length }}</text>
            </view>
          </view>
          <view class="score-right">
            <view class="score-icon">↻</view>
          </view>
        </view>
      </view>

      <!-- 房间成员 -->
      <view v-if="detail" class="member-card">
        <view class="section-header">
          <text class="section-title">房间成员 ({{ members.length }})</text>
          <button size="mini" class="ghost-btn" @tap="fetchRoomDetailData(selectedRoomId)">
            刷新
          </button>
        </view>
        <view class="member-list">
          <view v-for="item in memberCards" :key="item.id" class="member-row">
            <view class="avatar" :class="{ me: item.tag === '我' }">
              <image v-if="item.avatar" :src="item.avatar" mode="aspectFill" class="avatar-img" />
              <text v-else class="avatar-text">{{ item.name?.slice(0, 1) || '友' }}</text>
            </view>
            <view class="member-info">
              <text class="member-name">
                {{ item.name }}
                <text v-if="item.tag" class="me-tag">{{ item.tag }}</text>
              </text>
              <text class="member-id">ID: #{{ item.id.slice(-4) }}</text>
            </view>
            <view
              class="member-score"
              :class="{ positive: item.score >= 0, negative: item.score < 0 }"
            >
              <text>{{ item.score >= 0 ? '+' : '' }}{{ formatAmount(item.score) }}</text>
            </view>
            <button
              class="transfer-btn"
              size="mini"
              type="primary"
              @tap.stop="openQuickTransfer(item.id)"
            >
              转账
            </button>
          </view>
        </view>
      </view>

      <!-- 快速转账弹窗 -->
      <uni-popup ref="transferPopupRef" type="center">
        <view class="popup-card">
          <view class="popup-header">
            <text class="popup-title">输入转账金额</text>
            <text class="popup-close" @tap="transferPopupRef?.close?.()">×</text>
          </view>
          <view class="popup-body">
            <uni-easyinput v-model="quickAmount" placeholder="请输入金额" type="digit" />
          </view>
          <view class="popup-actions">
            <button class="popup-btn ghost" @tap="transferPopupRef?.close?.()">取消</button>
            <button class="popup-btn primary" :loading="submitting" @tap="submitQuickTransfer">
              确认
            </button>
          </view>
        </view>
      </uni-popup>

      <!-- 快捷操作 -->
      <view v-if="detail" class="action-section footer-actions">
        <button class="action-btn ghost" @tap="goHome">离开房间</button>
        <button class="action-btn primary" type="primary" @tap="goToRoomDetail">结算积分</button>
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

.info-card {
  background: linear-gradient(135deg, #27ba9b, #1f8ef1);
  border-radius: 24rpx;
  padding: 32rpx;
  color: #fff;
  box-shadow: 0 4rpx 20rpx rgba(39, 186, 155, 0.3);
}

.info-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.room-meta {
  flex: 1;
}

.room-name {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.room-code {
  display: block;
  font-size: 24rpx;
  opacity: 0.9;
  letter-spacing: 2rpx;
}

.room-actions .ghost-btn {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: none;
}

.score-card {
  margin-top: 8rpx;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(6rpx);
}

.score-card.positive .score-value {
  color: #e9ffed;
}

.score-card.negative .score-value {
  color: #ffe9e9;
}

.score-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.score-label {
  font-size: 24rpx;
  opacity: 0.9;
}

.score-value {
  font-size: 44rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.score-sub {
  display: flex;
  gap: 16rpx;
  font-size: 24rpx;
  opacity: 0.9;
}

.score-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}

.member-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #222;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 18rpx 16rpx;
  border-radius: 18rpx;
  background: #f7f9fc;
  border: 2rpx solid #e4e9f2;
}

.avatar {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fb, #eaf4ff);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar.me {
  background: linear-gradient(135deg, #27ba9b, #1f8ef1);
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.avatar-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #4c6fff;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.member-name {
  font-size: 28rpx;
  color: #222;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.member-id {
  font-size: 24rpx;
  color: #999;
}

.me-tag {
  margin-left: 8rpx;
  padding: 4rpx 10rpx;
  background: rgba(39, 186, 155, 0.15);
  color: #27ba9b;
  border-radius: 999rpx;
  font-size: 22rpx;
}

.member-score {
  font-size: 30rpx;
  font-weight: 600;
  min-width: 140rpx;
  text-align: right;
}

.member-score.positive {
  color: #27ba9b;
}

.member-score.negative {
  color: #e55d5d;
}

.transfer-btn {
  border-radius: 16rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
}

.popup-card {
  width: 520rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 24rpx 64rpx rgba(0, 0, 0, 0.2);
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.popup-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #222;
}

.popup-close {
  font-size: 36rpx;
  color: #999;
}

.popup-body {
  margin-bottom: 20rpx;
}

.popup-actions {
  display: flex;
  gap: 16rpx;
}

.popup-btn {
  flex: 1;
  border-radius: 18rpx;
  padding: 20rpx 0;
  font-size: 28rpx;
}

.popup-btn.ghost {
  background: #f5f7fb;
  color: #333;
}

.popup-btn.primary {
  background: linear-gradient(135deg, #27ba9b, #1f8ef1);
  color: #fff;
}

.not-member-tip {
  background: #fffbe6;
  border-radius: 24rpx;
  padding: 40rpx;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.action-section {
  margin-top: 8rpx;
}

.action-btn {
  width: 100%;
  border-radius: 20rpx;
  padding: 28rpx 0;
  font-size: 30rpx;
}

.action-btn.ghost {
  background: #f5f7fb;
  color: #333;
  border: 1rpx solid #e0e0e0;
}

.action-btn.primary {
  background: linear-gradient(135deg, #27ba9b, #1f8ef1);
  color: #fff;
  border: none;
}

.footer-actions {
  display: flex;
  gap: 16rpx;
}

.ghost-btn {
  background: #f5f7fb;
  color: #333;
  border: 1rpx solid #e0e0e0;
}
</style>
