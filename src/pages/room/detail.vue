<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { useMemberStore } from '@/stores'
import {
  createTransfer,
  fetchRoomDetail,
  type RoomDetail,
  type RoomMember,
  type RoomTransaction,
} from '@/services/room'

const memberStore = useMemberStore()
const roomId = ref('')
const detail = ref<RoomDetail | null>(null)
const loading = ref(true)
const submitting = ref(false)
const transferForm = reactive({
  fromMemberId: '',
  toMemberId: '',
  amount: '',
  remark: '',
})

const members = computed(() => detail.value?.members ?? [])
const transactions = computed(() => detail.value?.transactions ?? [])

const memberLabel = (member: RoomMember, index: number) => {
  const order = index >= 0 ? index + 1 : 1
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

const myMemberId = computed(() => {
  if (!memberStore.profile?.id) return ''
  const me = members.value.find((member) => member.user_id === memberStore.profile?.id)
  return me?.id ?? ''
})

const myBalance = computed(() => {
  const me = members.value.find((member) => member.id === myMemberId.value)
  return me ? Number(me.balance) : 0
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

const formatTime = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getMonth() + 1}/${String(date.getDate()).padStart(2, '0')} ${String(
    date.getHours(),
  ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const formatAmount = (value: string | number) => {
  const num = Number(value)
  if (Number.isNaN(num)) return value
  return num.toFixed(2)
}

const fetchDetail = async () => {
  if (!roomId.value) return
  loading.value = true
  try {
    const res = await fetchRoomDetail(roomId.value)
    detail.value = res.data
  } catch (error) {
    console.error(error)
    uni.showToast({ title: '加载房间失败', icon: 'none' })
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

const copyInviteCode = () => {
  const inviteCode = detail.value?.room.invite_code
  if (!inviteCode) return
  uni.setClipboardData({
    data: inviteCode,
    success: () => {
      uni.showToast({ title: '已复制邀请码', icon: 'success' })
    },
  })
}

const onTargetChange = (event: any) => {
  const index = Number(event.detail?.value ?? -1)
  const target = transferTargets.value[index]
  if (target) {
    transferForm.toMemberId = target.id
  }
}

const submitTransfer = async () => {
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
    await createTransfer(roomId.value, {
      fromMemberId: transferForm.fromMemberId,
      toMemberId: transferForm.toMemberId,
      amount: Number(amountNumber.toFixed(2)),
      remark: transferForm.remark.trim(),
    })
    uni.showToast({ title: '记账成功', icon: 'success' })
    transferForm.amount = ''
    transferForm.remark = ''
    await fetchDetail()
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
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

onLoad((query) => {
  roomId.value = (query?.roomId as string) || ''
  if (!roomId.value) {
    uni.showToast({ title: '缺少房间信息', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1000)
    return
  }
  fetchDetail()
})

onPullDownRefresh(() => {
  fetchDetail()
})
</script>

<template>
  <view class="room-page">
    <view v-if="loading" class="state">
      <uni-load-more status="loading" iconType="circle" />
    </view>

    <view v-else-if="detail" class="content">
      <view class="card room-card">
        <view class="room-title">
          <text class="name">{{ detail.room.name }}</text>
          <text class="badge">{{ myMemberId ? '已加入' : '访客' }}</text>
        </view>
        <view class="invite">
          <text class="label">邀请码</text>
          <text class="code">{{ detail.room.invite_code }}</text>
          <button class="copy-btn" size="mini" @tap="copyInviteCode">复制</button>
        </view>
        <view class="quick-stats">
          <view class="stat">
            <text class="stat-value">{{ members.length }}</text>
            <text class="stat-label">成员</text>
          </view>
          <view class="stat">
            <text class="stat-value">{{ formatAmount(myBalance) }}</text>
            <text class="stat-label">我的余额</text>
          </view>
        </view>
      </view>

      <view class="card member-card">
        <view class="section-title">
          <text>成员列表</text>
          <text class="sub">余额为正表示应收，负表示应付</text>
        </view>
        <view v-if="members.length" class="member-list">
          <view
            class="member-item"
            v-for="(member, index) in members"
            :key="member.id"
            :class="{ mine: member.id === myMemberId }"
          >
            <view class="info">
              <text class="name">{{ memberLabel(member, index) }}</text>
              <text class="time">加入于 {{ formatTime(member.joined_at) }}</text>
            </view>
            <text
              class="balance"
              :class="{
                positive: Number(member.balance) >= 0,
                negative: Number(member.balance) < 0,
              }"
            >
              {{ formatAmount(member.balance) }}
            </text>
          </view>
        </view>
        <view v-else class="empty">暂无成员</view>
      </view>

      <view class="card transfer-card">
        <view class="section-title">
          <text>记一笔</text>
          <text class="sub">记录成员之间的转账</text>
        </view>
        <view class="form-item">
          <text class="label">转出成员</text>
          <view class="input-field readonly">
            <text>{{ memberNameMap.get(transferForm.fromMemberId) || '仅支持本人转出' }}</text>
          </view>
        </view>
        <view class="form-item">
          <text class="label">转入成员</text>
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
          <text class="label">金额</text>
          <uni-easyinput v-model="transferForm.amount" placeholder="请输入金额" type="digit" />
        </view>
        <view class="form-item">
          <text class="label">备注</text>
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

      <view class="card txn-card">
        <view class="section-title">
          <text>最新流水</text>
          <text class="sub">展示最近 20 条记录</text>
        </view>
        <view v-if="transactions.length" class="txn-list">
          <view class="txn-item" v-for="txn in transactions" :key="txn.id">
            <view class="txn-main">
              <text class="txn-title">
                {{ memberNameMap.get(txn.from_member_id) || '未知' }} →
                {{ memberNameMap.get(txn.to_member_id) || '未知' }}
              </text>
              <text
                class="txn-amount"
                :class="{
                  income: transactionDirection(txn) === 'income',
                  expense: transactionDirection(txn) === 'expense',
                }"
              >
                {{ directionPrefix(txn) }}{{ formatAmount(txn.amount) }}
              </text>
            </view>
            <view class="txn-meta">
              <text>{{ formatTime(txn.created_at) }}</text>
              <text class="remark">{{ txn.remark || '无备注' }}</text>
            </view>
          </view>
        </view>
        <view v-else class="empty">暂无流水</view>
      </view>
    </view>

    <view v-else class="state empty">
      <text>未找到数据</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.room-page {
  min-height: 100vh;
  background: #f5f7fb;
  padding: 32rpx;
}

.state {
  margin-top: 120rpx;
  display: flex;
  justify-content: center;
}

.state.empty {
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  color: #888;
}

.card {
  background: #fff;
  border-radius: 28rpx;
  padding: 32rpx;
  margin-bottom: 28rpx;
  box-shadow: 0 20rpx 40rpx rgba(15, 34, 58, 0.08);
}

.room-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.room-title .name {
  font-size: 36rpx;
  font-weight: 600;
}

.room-title .badge {
  font-size: 24rpx;
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  background: #e8f8f2;
  color: #27ba9b;
}

.invite {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 32rpx;
  font-size: 28rpx;
}

.invite .code {
  font-weight: 600;
  letter-spacing: 4rpx;
}

.copy-btn {
  border-radius: 999rpx;
}

.quick-stats {
  display: flex;
  justify-content: space-between;
}

.stat {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #222;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.section-title {
  display: flex;
  justify-content: space-between;
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
}

.section-title .sub {
  font-size: 24rpx;
  font-weight: 400;
  color: #999;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.member-item {
  display: flex;
  justify-content: space-between;
  padding: 24rpx;
  border-radius: 20rpx;
  background: #f8fafc;
}

.member-item.mine {
  background: rgba(39, 186, 155, 0.08);
  border: 1rpx solid rgba(39, 186, 155, 0.4);
}

.member-item .info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.member-item .name {
  font-size: 28rpx;
  font-weight: 500;
}

.member-item .time {
  font-size: 24rpx;
  color: #999;
}

.balance {
  font-size: 30rpx;
  font-weight: 600;
}

.balance.positive {
  color: #27ba9b;
}

.balance.negative {
  color: #f56c6c;
}

.transfer-card .form-item {
  margin-bottom: 24rpx;
}

.form-item .label {
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

.input-field .arrow {
  font-size: 40rpx;
  color: #bbb;
}

.submit-btn {
  margin-top: 12rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #27ba9b, #1f8ef1);
}

.txn-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.txn-item {
  border-bottom: 1rpx solid #f0f1f5;
  padding-bottom: 20rpx;
}

.txn-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.txn-main {
  display: flex;
  justify-content: space-between;
  font-size: 28rpx;
}

.txn-amount {
  font-weight: 600;
}

.txn-amount.income {
  color: #27ba9b;
}

.txn-amount.expense {
  color: #f56c6c;
}

.txn-meta {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999;
  display: flex;
  justify-content: space-between;
}

.txn-meta .remark {
  color: #666;
  max-width: 360rpx;
}

.empty {
  padding: 40rpx 0;
  text-align: center;
  color: #999;
}
</style>
