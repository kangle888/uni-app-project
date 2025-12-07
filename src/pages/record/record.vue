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

const goToRoomDetail = () => {
  if (selectedRoomId.value) {
    uni.navigateTo({
      url: `/pages/room/detail?roomId=${selectedRoomId.value}`,
    })
  }
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
      <button
        class="login-btn"
        type="primary"
        size="mini"
        @tap="() => uni.navigateTo({ url: '/pages/login/login' })"
      >
        去登录
      </button>
    </view>

    <view v-else-if="loading && !detail" class="state">
      <uni-load-more status="loading" iconType="circle" />
    </view>

    <view v-else-if="rooms.length === 0" class="state empty">
      <image class="empty-img" src="/static/images/blank.png" mode="widthFix" />
      <text class="empty-text">暂无房间，请先创建或加入房间</text>
      <button
        class="action-btn"
        type="primary"
        size="mini"
        @tap="() => uni.switchTab({ url: '/pages/index/index' })"
      >
        去首页
      </button>
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
        <view class="info-header">
          <view class="info-left">
            <text class="room-name">{{ detail.room.name }}</text>
            <text class="room-code">邀请码：{{ detail.room.invite_code }}</text>
          </view>
          <view
            class="balance-badge"
            :class="{ positive: myBalance >= 0, negative: myBalance < 0 }"
          >
            <text class="balance-label">我的余额</text>
            <text class="balance-value">¥{{ formatAmount(Math.abs(myBalance)) }}</text>
          </view>
        </view>
        <view class="info-stats">
          <text class="stat-text">{{ members.length }} 位成员</text>
        </view>
      </view>

      <!-- 记账表单 -->
      <view v-if="detail && myMemberId" class="record-card">
        <view class="card-title">
          <text>记一笔</text>
          <text class="subtitle">记录成员之间的转账</text>
        </view>

        <view class="form-item">
          <text class="form-label">转出成员</text>
          <view class="input-field readonly">
            <text>{{ memberNameMap.get(transferForm.fromMemberId) || '仅支持本人转出' }}</text>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">转入成员</text>
          <picker
            mode="selector"
            :range="transferTargets"
            range-key="label"
            :value="targetIndex >= 0 ? targetIndex : 0"
            @change="onTargetChange"
          >
            <view class="input-field selectable">
              <text>{{ targetLabel }}</text>
              <text class="arrow">›</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">金额</text>
          <uni-easyinput v-model="transferForm.amount" placeholder="请输入金额" type="digit" />
        </view>

        <view class="form-item">
          <text class="form-label">备注</text>
          <uni-easyinput v-model="transferForm.remark" placeholder="可填写事项说明" />
        </view>

        <button
          class="submit-btn"
          type="primary"
          :loading="submitting"
          :disabled="!myMemberId || submitting"
          @tap="submitTransfer"
        >
          记录转账
        </button>
      </view>

      <view v-else-if="detail && !myMemberId" class="not-member-tip">
        <text class="tip-text">您尚未加入此房间，无法记账</text>
        <button class="action-btn" type="primary" size="mini" @tap="goToRoomDetail">
          查看房间详情
        </button>
      </view>

      <!-- 快捷操作 -->
      <view v-if="detail" class="action-section">
        <button class="action-btn" type="default" @tap="goToRoomDetail">查看完整详情</button>
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

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24rpx;
}

.info-left {
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

.balance-badge {
  text-align: right;
  padding: 16rpx 24rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  backdrop-filter: blur(10rpx);
}

.balance-label {
  display: block;
  font-size: 22rpx;
  opacity: 0.9;
  margin-bottom: 4rpx;
}

.balance-value {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
}

.info-stats {
  font-size: 24rpx;
  opacity: 0.9;
}

.record-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.card-title {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 32rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f0f1f5;
}

.card-title text:first-child {
  font-size: 32rpx;
  font-weight: 600;
  color: #222;
}

.subtitle {
  font-size: 24rpx;
  color: #999;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  color: #555;
  margin-bottom: 12rpx;
}

.input-field {
  min-height: 80rpx;
  border-radius: 18rpx;
  padding: 0 24rpx;
  background: #f5f7fb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 28rpx;
}

.input-field.readonly {
  color: #888;
}

.input-field.selectable {
  color: #222;
}

.arrow {
  font-size: 40rpx;
  color: #bbb;
}

.submit-btn {
  margin-top: 12rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #27ba9b, #1f8ef1);
  padding: 28rpx 0;
  font-size: 30rpx;
  font-weight: 500;
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
</style>
