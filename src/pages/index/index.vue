<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { useMemberStore } from '@/stores'
import { createRoom, fetchRooms, joinRoom, type RoomSummary } from '@/services/room'

const memberStore = useMemberStore()
const rooms = ref<RoomSummary[]>([])
const loading = ref(false)
const creating = ref(false)
const joining = ref(false)
const createForm = reactive({ name: '' })
const joinForm = reactive({ inviteCode: '' })
const createPopupRef = ref<any>(null)
const joinPopupRef = ref<any>(null)

const isLogin = computed(() => Boolean(memberStore.profile?.token))
const displayName = computed(() => memberStore.profile?.nickname || '朋友')

const fetchRoomList = async () => {
  if (!isLogin.value) return
  loading.value = true
  try {
    const res = await fetchRooms()
    rooms.value = res.data ?? []
  } catch (error) {
    console.error(error)
    uni.showToast({ title: '获取房间失败', icon: 'none' })
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

const goLogin = () => {
  uni.navigateTo({ url: '/pages/login/login' })
}

const openCreatePopup = () => {
  if (!isLogin.value) {
    goLogin()
    return
  }
  createPopupRef.value?.open?.('bottom')
}

const openJoinPopup = () => {
  if (!isLogin.value) {
    goLogin()
    return
  }
  joinPopupRef.value?.open?.('bottom')
}

const closeCreatePopup = () => {
  createPopupRef.value?.close?.()
}

const closeJoinPopup = () => {
  joinPopupRef.value?.close?.()
}

const handleCreateRoom = async () => {
  const name = createForm.name.trim()
  if (!name) {
    uni.showToast({ title: '请输入房间名称', icon: 'none' })
    return
  }
  creating.value = true
  try {
    await createRoom({ name })
    uni.showToast({ title: '房间创建成功', icon: 'success' })
    createForm.name = ''
    closeCreatePopup()
    await fetchRoomList()
  } catch (error) {
    console.error(error)
  } finally {
    creating.value = false
  }
}

const handleJoinRoom = async () => {
  const inviteCode = joinForm.inviteCode.trim().toUpperCase()
  if (inviteCode.length !== 8) {
    uni.showToast({ title: '邀请码需为8位字母或数字', icon: 'none' })
    return
  }
  joining.value = true
  try {
    await joinRoom({ inviteCode })
    uni.showToast({ title: '加入成功', icon: 'success' })
    joinForm.inviteCode = ''
    closeJoinPopup()
    await fetchRoomList()
  } catch (error) {
    console.error(error)
  } finally {
    joining.value = false
  }
}

const goRoomDetail = (room: RoomSummary) => {
  uni.navigateTo({
    url: `/pages/room/detail?roomId=${room.id}`,
  })
}

const formatTime = (value?: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`
}

onShow(() => {
  if (isLogin.value) {
    fetchRoomList()
  }
})

onPullDownRefresh(() => {
  fetchRoomList()
})

watch(
  () => memberStore.profile?.token,
  (token) => {
    if (!token) {
      rooms.value = []
    }
  },
)
</script>

<template>
  <view class="page">
    <view class="hero-card">
      <view class="greeting">
        <text class="hello">Hi，{{ displayName }}</text>
        <text class="subtitle">一起把房间账本管好</text>
      </view>
      <view class="stats">
        <view class="stat-item">
          <text class="stat-value">{{ rooms.length }}</text>
          <text class="stat-label">房间数量</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ isLogin ? '在线' : '未登录' }}</text>
          <text class="stat-label">登录状态</text>
        </view>
      </view>
    </view>

    <view v-if="isLogin" class="action-card">
      <button class="action-btn primary" @tap="openCreatePopup">创建房间</button>
      <button class="action-btn ghost" @tap="openJoinPopup">加入房间</button>
    </view>

    <view v-else class="login-tip">
      <text class="tip-title">登录后即可创建或加入房间</text>
      <button class="login-btn" type="warn" size="mini" @tap="goLogin">去登录</button>
    </view>

    <view class="list-header" v-if="isLogin">
      <text class="title">我的房间</text>
      <button class="refresh-btn" size="mini" @tap="fetchRoomList" :loading="loading">刷新</button>
    </view>

    <view v-if="loading" class="state">
      <uni-load-more status="loading" iconType="circle" />
    </view>

    <view v-else-if="rooms.length" class="room-list">
      <uni-card
        v-for="room in rooms"
        :key="room.id"
        is-full="true"
        margin="0 0 24rpx"
        @tap="goRoomDetail(room)"
      >
        <view class="room-card">
          <view class="room-head">
            <text class="room-name">{{ room.name }}</text>
            <text class="room-tag">{{
              room.creator_id === memberStore.profile?.id ? '我创建' : '我加入'
            }}</text>
          </view>
          <view class="room-meta">
            <view>
              <text class="meta-label">邀请码</text>
              <text class="meta-value">{{ room.invite_code }}</text>
            </view>
            <view>
              <text class="meta-label">创建时间</text>
              <text class="meta-value">{{ formatTime(room.created_at) }}</text>
            </view>
          </view>
        </view>
      </uni-card>
    </view>

    <view v-else-if="isLogin" class="state empty">
      <image class="empty-img" src="/static/images/blank.png" mode="widthFix" />
      <text class="empty-text">暂时还没有房间，快去组织一个吧</text>
      <view class="empty-actions">
        <button size="mini" type="primary" @tap="openCreatePopup">创建房间</button>
        <button size="mini" plain @tap="openJoinPopup">加入房间</button>
      </view>
    </view>

    <uni-popup ref="createPopupRef" type="bottom" background-color="#f8f9fb">
      <view class="popup-card">
        <view class="popup-title">创建房间</view>
        <uni-easyinput v-model="createForm.name" placeholder="输入房间名称" maxlength="20" />
        <view class="popup-actions">
          <button class="ghost" size="mini" @tap="closeCreatePopup">取消</button>
          <button
            class="primary"
            size="mini"
            type="primary"
            :loading="creating"
            @tap="handleCreateRoom"
          >
            创建
          </button>
        </view>
      </view>
    </uni-popup>

    <uni-popup ref="joinPopupRef" type="bottom" background-color="#f8f9fb">
      <view class="popup-card">
        <view class="popup-title">加入房间</view>
        <uni-easyinput v-model="joinForm.inviteCode" placeholder="输入8位邀请码" maxlength="8" />
        <view class="popup-actions">
          <button class="ghost" size="mini" @tap="closeJoinPopup">取消</button>
          <button
            class="primary"
            size="mini"
            type="primary"
            :loading="joining"
            @tap="handleJoinRoom"
          >
            加入
          </button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 32rpx;
  background: linear-gradient(180deg, #f5fbff 0%, #fefefe 120rpx);
}

.hero-card {
  background: #1f8ef1;
  color: #fff;
  border-radius: 32rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 40rpx;
  box-shadow: 0 24rpx 48rpx rgba(31, 142, 241, 0.25);
}

.greeting .hello {
  font-size: 40rpx;
  font-weight: 600;
}

.greeting .subtitle {
  display: block;
  margin-top: 12rpx;
  font-size: 28rpx;
  opacity: 0.85;
}

.stats {
  display: flex;
  justify-content: space-between;
}

.stat-item {
  flex: 1;
  padding-right: 20rpx;
}

.stat-value {
  display: block;
  font-size: 44rpx;
  font-weight: 600;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  opacity: 0.9;
}

.action-card {
  margin-top: 32rpx;
  display: flex;
  gap: 24rpx;
}

.action-btn {
  flex: 1;
  border-radius: 20rpx;
  padding: 28rpx 0;
  font-size: 30rpx;
  font-weight: 500;
  border: none;
}

.action-btn.primary {
  background: #27ba9b;
  color: #fff;
}

.action-btn.ghost {
  background: rgba(39, 186, 155, 0.1);
  color: #27ba9b;
}

.login-tip {
  margin: 32rpx 0;
  padding: 28rpx;
  border-radius: 24rpx;
  background: #fffbe6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 28rpx;
  color: #8c6c1a;
}

.list-header {
  margin-top: 48rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 32rpx;
  font-weight: 600;
  color: #222;
}

.refresh-btn {
  border-radius: 999rpx;
}

.room-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.room-card {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.room-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.room-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.room-tag {
  font-size: 24rpx;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(39, 186, 155, 0.12);
  color: #27ba9b;
}

.room-meta {
  display: flex;
  justify-content: space-between;
  font-size: 26rpx;
  color: #666;
}

.meta-label {
  display: block;
  margin-bottom: 8rpx;
  font-size: 24rpx;
  color: #999;
}

.meta-value {
  font-weight: 500;
  color: #333;
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

.empty-actions {
  display: flex;
  gap: 20rpx;
}

.popup-card {
  padding: 40rpx 32rpx 32rpx;
  border-radius: 32rpx 32rpx 0 0;
  background: #fff;
  box-shadow: 0 -12rpx 48rpx rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
}

.popup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 24rpx;
}

.popup-actions .ghost {
  background: transparent;
  color: #666;
  border: 1rpx solid #ccc;
}

.popup-actions .primary {
  min-width: 160rpx;
}
</style>
