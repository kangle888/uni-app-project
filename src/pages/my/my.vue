<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useMemberStore } from '@/stores'
import { fetchRooms, type RoomSummary } from '@/services/room'
import { updateProfile } from '@/services/user'
import { http } from '@/utils/http'

const memberStore = useMemberStore()
const rooms = ref<RoomSummary[]>([])
const loading = ref(false)
const editingNickname = ref('')
const uploading = ref(false)
const nicknamePopupRef = ref<any>()

const isLogin = computed(() => Boolean(memberStore.profile?.token))
const userInfo = computed(() => memberStore.profile)
const displayName = computed(() => memberStore.profile?.nickname || '朋友')
const baseURL =
  import.meta.env.MODE === 'development' ? 'http://localhost:10000' : 'https://xklandlxy.art'
const normalizeUrl = (url?: string | null) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return `${baseURL}${url}`
  return `${baseURL}/${url}`
}
const avatarSrc = computed(() => normalizeUrl(userInfo.value?.avatar_url))

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

// 上传 base64 到后端
const uploadBase64 = (filename: string, base64: string) => {
  return http<{ filePath: string }>({
    url: '/upload/base64',
    method: 'POST',
    data: { filename, base64: encodeURIComponent(base64) },
  })
}

// 使用微信头像昵称
const useWechatProfile = () => {
  if (!isLogin.value) {
    goToLogin()
    return
  }
  uni.getUserProfile({
    desc: '用于完善头像昵称',
    success: async (res) => {
      try {
        const avatar_url = res.userInfo?.avatarUrl
        const nickname = res.userInfo?.nickName
        const normalizedAvatar = normalizeUrl(avatar_url)
        await updateProfile({ avatar_url: normalizedAvatar, nickname })
        memberStore.setProfile({
          ...memberStore.profile,
          avatar_url: normalizedAvatar,
          nickname,
        })
        uni.showToast({ title: '已同步微信资料', icon: 'success' })
      } catch (err) {
        console.error(err)
        uni.showToast({ title: '同步失败', icon: 'none' })
      }
    },
    fail: () => {
      uni.showToast({ title: '用户取消授权', icon: 'none' })
    },
  })
}

const updateAvatar = async (avatar_url: string) => {
  const normalized = normalizeUrl(avatar_url)
  await updateProfile({ avatar_url: normalized })
  memberStore.setProfile({
    ...memberStore.profile,
    avatar_url: normalized,
  })
  uni.showToast({ title: '头像已更新', icon: 'success' })
}

const chooseAndUploadImage = async (sourceType: Array<'album' | 'camera'>) => {
  if (!isLogin.value) {
    goToLogin()
    return
  }
  try {
    uploading.value = true
    const { tempFilePaths } = await uni.chooseImage({ count: 1, sourceType })
    const filePath = tempFilePaths?.[0]
    if (!filePath) throw new Error('未选择图片')
    const fs = uni.getFileSystemManager()
    const base64 = fs.readFileSync(filePath, 'base64') as string
    const ext = filePath.split('.').pop() || 'jpg'
    const dataUrl = `data:image/${ext};base64,${base64}`
    const uploadRes = await uploadBase64(`avatar.${ext}`, dataUrl)
    const serverUrl =
      uploadRes.data?.fileUrlAbsolute || uploadRes.data?.fileUrl || uploadRes.data?.filePath
    if (!serverUrl) throw new Error('上传失败')
    await updateAvatar(serverUrl)
  } catch (error: any) {
    console.error(error)
    uni.showToast({ title: error?.message || '上传失败', icon: 'none' })
  } finally {
    uploading.value = false
  }
}

const openAvatarActions = () => {
  if (!isLogin.value) {
    goToLogin()
    return
  }
  uni.showActionSheet({
    itemList: ['用微信头像昵称', '从相册选择', '拍照'],
    success: (res) => {
      const index = res.tapIndex
      if (index === 0) {
        useWechatProfile()
      } else if (index === 1) {
        chooseAndUploadImage(['album'])
      } else if (index === 2) {
        chooseAndUploadImage(['camera'])
      }
    },
  })
}

const openNicknamePopup = () => {
  if (!isLogin.value) {
    goToLogin()
    return
  }
  editingNickname.value = displayName.value
  nicknamePopupRef.value?.open?.('center')
}

const submitNickname = async () => {
  if (!editingNickname.value.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }
  try {
    await updateProfile({ nickname: editingNickname.value.trim() })
    memberStore.setProfile({
      ...memberStore.profile,
      nickname: editingNickname.value.trim(),
    })
    uni.showToast({ title: '昵称已更新', icon: 'success' })
    nicknamePopupRef.value?.close?.()
  } catch (error) {
    console.error(error)
    uni.showToast({ title: '更新失败', icon: 'none' })
  }
}

onShow(() => {
  if (isLogin.value) {
    fetchRoomList()
  }
})
</script>

<template>
  <view class="page">
    <view class="hero">
      <view v-if="isLogin" class="hero-profile">
        <view class="hero-avatar" @tap="openAvatarActions">
          <image v-if="avatarSrc" :src="avatarSrc" mode="aspectFill" class="hero-avatar-img" />
          <text v-else class="hero-avatar-text">{{ displayName.charAt(0) }}</text>
          <view v-if="uploading" class="hero-avatar-mask">...</view>
        </view>
        <text class="hero-name">{{ displayName }}</text>
      </view>
      <view v-else class="hero-login">
        <button class="login-btn" type="primary" size="mini" @tap="goToLogin">登录 / 授权</button>
      </view>
      <view v-if="isLogin" class="hero-stats">
        <view class="stat">
          <text class="stat-value">{{ rooms.length }}</text>
          <text class="stat-label">房间数</text>
        </view>
        <view class="divider"></view>
        <view class="stat">
          <text class="stat-value">{{ loading ? '--' : rooms.length }}</text>
          <text class="stat-label">参与场次</text>
        </view>
      </view>
    </view>

    <view class="card list-card">
      <view class="list-row" @tap="openAvatarActions">
        <view class="row-left">
          <text class="row-icon">😀</text>
          <text class="row-title">头像</text>
        </view>
        <view class="row-right">
          <view class="mini-avatar">
            <image v-if="avatarSrc" :src="avatarSrc" mode="aspectFill" />
            <text v-else>{{ displayName.charAt(0) }}</text>
          </view>
          <text class="row-arrow">›</text>
        </view>
      </view>
      <view class="list-row" @tap="openNicknamePopup">
        <view class="row-left">
          <text class="row-icon">📝</text>
          <text class="row-title">昵称</text>
        </view>
        <view class="row-right">
          <text class="row-desc">{{ displayName }}</text>
          <text class="row-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="card menu-card">
      <view class="menu-item" @tap="goToSettings">
        <view class="menu-left">
          <text class="menu-icon">⚙</text>
          <text class="menu-title">设置</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="() => uni.switchTab({ url: '/pages/index/index' })">
        <view class="menu-left">
          <text class="menu-icon">🏠</text>
          <text class="menu-title">我的房间</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 昵称修改弹窗 -->
    <uni-popup ref="nicknamePopupRef" type="center">
      <view class="popup-card">
        <view class="popup-header">
          <text class="popup-title">修改昵称</text>
          <text class="popup-close" @tap="nicknamePopupRef?.close?.()">×</text>
        </view>
        <view class="popup-body">
          <uni-easyinput
            v-model="editingNickname"
            placeholder="请输入新的昵称"
            :inputBorder="false"
          />
        </view>
        <view class="popup-actions">
          <button class="popup-btn ghost" @tap="nicknamePopupRef?.close?.()">取消</button>
          <button class="popup-btn primary" @tap="submitNickname">保存</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #e6f0ff 0%, #f7f9ff 240rpx);
  padding: 24rpx;
}

.hero {
  background: linear-gradient(180deg, #eef4ff 0%, #ffffff 70%);
  border-radius: 32rpx;
  padding: 32rpx 24rpx 24rpx;
  box-shadow: 0 18rpx 36rpx rgba(77, 118, 255, 0.12);
  margin-bottom: 24rpx;
}

.hero-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx 0 24rpx;
}

.hero-avatar {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  background: #ffeef2;
  border: 6rpx solid #fff;
  box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.hero-avatar-img {
  width: 100%;
  height: 100%;
}

.hero-avatar-text {
  font-size: 52rpx;
  font-weight: 700;
  color: #ff7a95;
}

.hero-avatar-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-name {
  font-size: 38rpx;
  font-weight: 700;
  color: #222;
}

.hero-login {
  display: flex;
  justify-content: center;
  padding: 16rpx 0 24rpx;
}

.hero-stats {
  margin-top: 12rpx;
  background: #f5f8ff;
  border-radius: 20rpx;
  padding: 16rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #222;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  flex: 1;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 700;
}

.stat-label {
  font-size: 24rpx;
  color: #8a8fa6;
}

.divider {
  width: 1rpx;
  height: 52rpx;
  background: #e2e6f0;
}

.card {
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 20rpx;
}

.list-card {
  overflow: hidden;
}

.list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #f0f1f5;
}

.list-row:last-child {
  border-bottom: none;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.row-icon {
  font-size: 32rpx;
}

.row-title {
  font-size: 30rpx;
  color: #222;
}

.row-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.row-desc {
  font-size: 28rpx;
  color: #666;
}

.row-arrow {
  font-size: 36rpx;
  color: #b6b9c4;
}

.mini-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  overflow: hidden;
  background: #f5f7fb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: #4c6fff;
}

.mini-avatar image {
  width: 100%;
  height: 100%;
}

.edit-card {
  padding: 28rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.edit-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #222;
}

.edit-row {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.ghost-btn {
  width: 100%;
  border-radius: 20rpx;
  padding: 20rpx 0;
  background: #f5f7fb;
  color: #333;
  font-size: 28rpx;
}

.menu-card {
  padding: 0 8rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 16rpx;
  border-bottom: 1rpx solid #f0f1f5;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.menu-icon {
  font-size: 32rpx;
}

.menu-title {
  font-size: 30rpx;
  color: #222;
}

.menu-arrow {
  font-size: 36rpx;
  color: #b6b9c4;
}

.popup-card {
  width: 560rpx;
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
</style>
