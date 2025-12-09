<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { useMemberStore } from '@/stores'
import {
  createRoom,
  fetchRooms,
  joinRoom,
  generateRoomQRCode,
  type RoomSummary,
  type RoomDetail,
} from '@/services/room'

const memberStore = useMemberStore()
const rooms = ref<RoomSummary[]>([])
const loading = ref(false)
const creating = ref(false)
const joining = ref(false)
const createForm = reactive({ name: '' })
const joinForm = reactive({ inviteCode: '' })
const createPopupRef = ref<any>(null)
const joinPopupRef = ref<any>(null)
const qrCodePopupRef = ref<any>(null)
const createdRoom = ref<RoomDetail | null>(null)
const qrCodeImage = ref<string>('')
const sharingRoom = ref<RoomSummary | null>(null) // 当前要分享的房间

const isLogin = computed(() => Boolean(memberStore.profile?.token))
const displayName = computed(() => memberStore.profile?.nickname || '朋友')
const inviteCode = computed(() => {
  // 优先使用正在分享的房间的邀请码，否则使用刚创建的房间
  return sharingRoom.value?.invite_code || createdRoom.value?.room.invite_code || ''
})
const sharingRoomName = computed(() => {
  return sharingRoom.value?.name || createdRoom.value?.room.name || ''
})

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
  createPopupRef.value?.open?.('center')
}

const openJoinPopup = () => {
  if (!isLogin.value) {
    goLogin()
    return
  }
  joinPopupRef.value?.open?.('center')
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
    const res = await createRoom({ name })
    createdRoom.value = res.data
    createForm.name = ''
    closeCreatePopup()
    await fetchRoomList()
    // 生成二维码
    await generateQRCode()
    // 显示二维码弹窗
    qrCodePopupRef.value?.open?.('center')
  } catch (error) {
    console.error(error)
  } finally {
    creating.value = false
  }
}

// 复制邀请码
const copyInviteCode = () => {
  if (!inviteCode.value) return
  uni.setClipboardData({
    data: inviteCode.value,
    success: () => {
      uni.showToast({ title: '邀请码已复制', icon: 'success' })
    },
  })
}

// 分享到微信好友（非微信小程序平台使用）
const shareToWechat = () => {
  // #ifndef MP-WEIXIN
  // 其他平台提示
  uni.showToast({
    title: '请使用右上角分享功能',
    icon: 'none',
  })
  // #endif
}

// 关闭二维码弹窗
const closeQRCodePopup = () => {
  qrCodePopupRef.value?.close?.()
  createdRoom.value = null
  sharingRoom.value = null
  qrCodeImage.value = ''
}

// 处理扫码进入（通过 URL 参数进入的情况）
onLoad((options) => {
  // 如果通过 URL 参数进入（如分享链接），options 中会包含 inviteCode
  if (options?.inviteCode) {
    const code = String(options.inviteCode).trim().toUpperCase()
    if (code.length === 8) {
      if (isLogin.value) {
        // 已登录，直接填充并打开加入弹窗
        joinForm.inviteCode = code
        setTimeout(() => {
          openJoinPopup()
        }, 500)
      } else {
        // 未登录，保存邀请码并跳转登录
        memberStore.setPendingInviteCode(code)
        setTimeout(() => {
          goLogin()
        }, 500)
      }
    }
  }
})

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

// 显示房间二维码（用于分享已有房间）
const showRoomQRCode = async (room: RoomSummary, event?: any) => {
  // 阻止事件冒泡，避免触发卡片点击
  if (event) {
    event.stopPropagation()
  }

  sharingRoom.value = room
  createdRoom.value = null // 清空创建的房间信息

  // 生成二维码
  await generateQRCode()
  // 显示二维码弹窗
  qrCodePopupRef.value?.open?.('center')
}

// 修改生成二维码函数，使用后端生成微信小程序码
const generateQRCode = async () => {
  const code = inviteCode.value
  if (!code) return

  try {
    // 调用后端接口生成微信小程序码
    const res = await generateRoomQRCode({ inviteCode: code })
    if (res.data?.qrCode) {
      // 后端返回的是 base64 格式的图片
      qrCodeImage.value = res.data.qrCode
    } else {
      throw new Error('生成二维码失败：返回数据为空')
    }
  } catch (error: any) {
    console.error('生成二维码失败:', error)
    uni.showToast({
      title: error?.message || '生成二维码失败',
      icon: 'none',
      duration: 2000,
    })
    qrCodeImage.value = ''
  }
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

    // 检查是否有待加入的房间邀请码（从扫码进入但未登录的情况）
    const pendingCode = memberStore.pendingInviteCode
    if (pendingCode) {
      const code = String(pendingCode).trim().toUpperCase()
      if (code.length === 8) {
        joinForm.inviteCode = code
        // 自动打开加入房间弹窗
        setTimeout(() => {
          openJoinPopup()
        }, 500)
      }
      // 清除待加入码
      memberStore.clearPendingInviteCode()
    }
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

// 微信小程序分享配置
// #ifdef MP-WEIXIN
// @ts-ignore
const onShareAppMessage = () => {
  const room = sharingRoom.value || createdRoom.value?.room
  if (room && inviteCode.value) {
    return {
      title: `邀请你加入房间：${room.name}`,
      path: `/pages/index/index?inviteCode=${inviteCode.value}`,
      imageUrl: qrCodeImage.value || '',
    }
  }
  return {
    title: '房间账本小程序',
    path: '/pages/index/index',
  }
}
// #endif
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

    <view v-if="isLogin" class="room-list-container">
      <view class="list-header">
        <text class="title">我的房间</text>
        <button class="refresh-btn" size="mini" @tap="fetchRoomList" :loading="loading">
          刷新
        </button>
      </view>

      <scroll-view
        class="room-scroll-view"
        scroll-y
        :refresher-enabled="true"
        :refresher-triggered="loading"
        @refresherrefresh="fetchRoomList"
      >
        <view v-if="loading" class="state">
          <uni-load-more status="loading" iconType="circle" />
        </view>

        <view v-else-if="rooms.length" class="room-list">
          <uni-card
            v-for="room in rooms"
            :key="room.id"
            :is-full="true"
            margin="0 0 24rpx"
            @tap="goRoomDetail(room)"
          >
            <view class="room-card">
              <view class="room-head">
                <view class="room-title-section">
                  <text class="room-name">{{ room.name }}</text>
                  <text class="room-tag">{{
                    room.creator_id === memberStore.profile?.id ? '我创建' : '我加入'
                  }}</text>
                </view>
                <button
                  class="share-room-btn"
                  size="mini"
                  type="primary"
                  @tap.stop="showRoomQRCode(room, $event)"
                >
                  分享
                </button>
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

        <view v-else class="state empty">
          <image class="empty-img" src="/static/images/blank.png" mode="widthFix" />
          <text class="empty-text">暂时还没有房间，快去组织一个吧</text>
          <view class="empty-actions">
            <button size="mini" type="primary" @tap="openCreatePopup">创建房间</button>
            <button size="mini" plain @tap="openJoinPopup">加入房间</button>
          </view>
        </view>
      </scroll-view>
    </view>

    <uni-popup ref="createPopupRef" type="center" class="my-popup">
      <view class="popup-card-center">
        <view class="popup-header-center">
          <text class="popup-title-center">创建房间</text>
          <text class="popup-close-icon" @tap="closeCreatePopup">×</text>
        </view>
        <view class="popup-content-center">
          <view class="input-wrapper">
            <text class="input-label">房间名称</text>
            <uni-easyinput
              v-model="createForm.name"
              placeholder="请输入房间名称"
              maxlength="20"
              :styles="{ borderColor: '#e0e0e0' }"
            />
            <text class="input-tip">2-20个字符</text>
          </view>
        </view>
        <view class="popup-actions-center">
          <button class="popup-btn-cancel" @tap="closeCreatePopup">取消</button>
          <button
            class="popup-btn-confirm"
            type="primary"
            :loading="creating"
            @tap="handleCreateRoom"
          >
            创建
          </button>
        </view>
      </view>
    </uni-popup>

    <uni-popup ref="joinPopupRef" type="center" class="my-popup">
      <view class="popup-card-center">
        <view class="popup-header-center">
          <text class="popup-title-center">加入房间</text>
          <text class="popup-close-icon" @tap="closeJoinPopup">×</text>
        </view>
        <view class="popup-content-center">
          <view class="input-wrapper">
            <text class="input-label">邀请码</text>
            <uni-easyinput
              v-model="joinForm.inviteCode"
              placeholder="请输入8位邀请码"
              maxlength="8"
              :styles="{ borderColor: '#e0e0e0' }"
            />
            <text class="input-tip">8位字母或数字</text>
          </view>
        </view>
        <view class="popup-actions-center">
          <button class="popup-btn-cancel" @tap="closeJoinPopup">取消</button>
          <button class="popup-btn-confirm" type="primary" :loading="joining" @tap="handleJoinRoom">
            加入
          </button>
        </view>
      </view>
    </uni-popup>

    <!-- 二维码分享弹窗 -->
    <uni-popup ref="qrCodePopupRef" type="center">
      <view class="qr-popup-card">
        <view class="qr-popup-header">
          <text class="qr-popup-title">{{ createdRoom ? '房间创建成功' : '分享房间' }}</text>
          <text class="qr-popup-close" @tap="closeQRCodePopup">×</text>
        </view>
        <view class="qr-popup-content">
          <view class="room-info">
            <text class="room-name-text">{{ sharingRoomName }}</text>
            <view class="invite-code-section">
              <text class="invite-code-label">邀请码</text>
              <view class="invite-code-box">
                <text class="invite-code-text">{{ inviteCode }}</text>
                <button class="copy-btn" size="mini" @tap="copyInviteCode">复制</button>
              </view>
            </view>
          </view>

          <view class="qr-code-section">
            <text class="qr-code-tip">扫描二维码加入房间</text>
            <view class="qr-code-wrapper">
              <image v-if="qrCodeImage" :src="qrCodeImage" mode="aspectFit" class="qr-code-image" />
              <view v-else class="qr-code-placeholder">
                <text>二维码生成中...</text>
              </view>
            </view>
          </view>
        </view>
        <view class="qr-popup-actions">
          <!-- #ifdef MP-WEIXIN -->
          <!-- 使用 open-type="share" 直接触发分享 -->
          <button class="share-btn" type="primary" open-type="share">分享给好友</button>
          <!-- #endif -->
          <!-- #ifndef MP-WEIXIN -->
          <button class="share-btn" type="primary" @tap="shareToWechat">分享给好友</button>
          <!-- #endif -->
          <button class="close-btn" @tap="closeQRCodePopup">完成</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<style lang="scss" scoped>
.my-popup {
  ::v-deep(.uni-popup__wrapper) {
    display: flex;
    justify-content: center !important;
  }
}

.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 24rpx;
  background: linear-gradient(180deg, #e6f0ff 0%, #f7f9ff 240rpx);
  box-sizing: border-box;
}

.hero-card {
  background: linear-gradient(180deg, #eef4ff 0%, #ffffff 75%);
  color: #222;
  border-radius: 32rpx;
  padding: 32rpx 28rpx;
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  box-shadow: 0 18rpx 36rpx rgba(77, 118, 255, 0.12);
}

.greeting .hello {
  font-size: 38rpx;
  font-weight: 700;
}

.greeting .subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 28rpx;
  color: #768099;
}

.stats {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
}

.stat-item {
  flex: 1;
  padding: 20rpx;
  background: #f5f8ff;
  border-radius: 20rpx;
}

.stat-value {
  display: block;
  font-size: 42rpx;
  font-weight: 700;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #8a8fa6;
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
  background: linear-gradient(135deg, #27ba9b, #1f8ef1);
  color: #fff;
}

.action-btn.ghost {
  background: #f5f7fb;
  color: #1f8ef1;
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

.room-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-top: 32rpx;
}

.list-header {
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.title {
  font-size: 32rpx;
  font-weight: 600;
  color: #222;
}

.refresh-btn {
  border-radius: 999rpx;
}

.room-scroll-view {
  flex: 1;
  height: 0; // 重要：让 scroll-view 可以正确计算高度
}

.room-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding-bottom: 32rpx; // 底部留白
}

.room-card {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.06);
}

.room-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.room-title-section {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.share-room-btn {
  border-radius: 20rpx;
  padding: 12rpx 24rpx;
  font-size: 24rpx;
  white-space: nowrap;
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
  flex-wrap: wrap;
  gap: 16rpx;
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

// 中间弹窗样式 - 美化UI
.popup-card-center {
  width: 640rpx;
  max-width: 100%;
  background: #fff;
  border-radius: 32rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24rpx 64rpx rgba(0, 0, 0, 0.2);
  animation: popupFadeIn 0.3s ease-out;
}

@keyframes popupFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20rpx);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.popup-header-center {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 48rpx 40rpx 32rpx;
  border-bottom: 1rpx solid #f0f1f5;
  background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
}

.popup-title-center {
  font-size: 38rpx;
  font-weight: 600;
  color: #222;
  letter-spacing: 1rpx;
}

.popup-close-icon {
  font-size: 44rpx;
  color: #999;
  line-height: 1;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.popup-close-icon:active {
  color: #666;
  background: #f5f7fb;
}

.popup-content-center {
  padding: 48rpx 40rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.input-label {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.input-tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
  padding-left: 4rpx;
}

.popup-actions-center {
  display: flex;
  gap: 24rpx;
  padding: 0 40rpx 40rpx;
}

.popup-btn-cancel {
  flex: 1;
  height: 96rpx;
  border-radius: 24rpx;
  background: #f5f7fb;
  color: #666;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.popup-btn-cancel:active {
  background: #e8eaed;
  transform: scale(0.98);
}

.popup-btn-confirm {
  flex: 1;
  height: 96rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #27ba9b 0%, #1f8ef1 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow: 0 8rpx 24rpx rgba(39, 186, 155, 0.3);
}

.popup-btn-confirm:active {
  opacity: 0.9;
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(39, 186, 155, 0.25);
}

.qr-popup-card {
  width: 600rpx;
  background: #fff;
  border-radius: 32rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.qr-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f1f5;
}

.qr-popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #222;
}

.qr-popup-close {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-popup-content {
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.room-info {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.room-name-text {
  font-size: 36rpx;
  font-weight: 600;
  color: #222;
  text-align: center;
}

.invite-code-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.invite-code-label {
  font-size: 24rpx;
  color: #666;
  text-align: center;
}

.invite-code-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 20rpx;
  background: #f5f7fb;
  border-radius: 16rpx;
}

.invite-code-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #27ba9b;
  letter-spacing: 4rpx;
}

.copy-btn {
  border-radius: 8rpx;
}

.qr-code-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.qr-code-tip {
  font-size: 24rpx;
  color: #999;
}

.qr-code-wrapper {
  width: 400rpx;
  height: 400rpx;
  background: #fff;
  border: 2rpx solid #f0f1f5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
}

.qr-code-image {
  width: 100%;
  height: 100%;
}

.qr-code-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 24rpx;
}

.qr-popup-actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 32rpx;
  border-top: 1rpx solid #f0f1f5;
}

.share-btn {
  width: 100%;
  border-radius: 20rpx;
  padding: 28rpx 0;
  font-size: 30rpx;
  background: linear-gradient(135deg, #27ba9b, #1f8ef1);
}

.close-btn {
  width: 100%;
  border-radius: 20rpx;
  padding: 24rpx 0;
  font-size: 28rpx;
  background: #f5f7fb;
  color: #666;
  border: none;
}
</style>
