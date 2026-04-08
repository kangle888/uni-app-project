<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useMemberStore } from '@/stores'
import { updateUserInfo, resetPassword, updatePassword, getCurrentUserInfo } from '@/services/login'
import {
  getEnterList,
  getFavoriteList,
  getUserBehaviorCount,
  getViewList,
} from '@/services/activity'

const memberStore = useMemberStore()
const loading = ref(false)

// State for settings popup
const settingsPopupRef = ref<any>()
const editForm = reactive({
  nickname: '',
  mobile: '',
  email: '',
  collegeName: '',
  sex: '',
})

// State for password popup
const pwdPopupRef = ref<any>()
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const isLogin = computed(() => Boolean(memberStore.profile?.token))
const displayName = computed(
  () => memberStore.profile?.nickname || memberStore.profile?.username || '同学',
)
const userInfo = computed(() => memberStore.profile)

// Displayed Info (using Mock fallbacks if empty)

const avatarSrc = computed(() => {
  return userInfo.value?.avatar_url || ''
})

const goToLogin = () => {
  uni.navigateTo({ url: '/pages/login/login' })
}

// 暂不实现真实上传，直接做UI演示
const onChooseAvatar = async (e: any) => {
  if (!isLogin.value) {
    goToLogin()
    return
  }
  const avatarUrl = e.detail.avatarUrl
  if (!avatarUrl) return

  // 仅前端模拟更新头像
  memberStore.setProfile({
    ...memberStore.profile,
    avatar_url: avatarUrl,
  })
  uni.showToast({ title: '头像已更新', icon: 'success' })
}

const openAvatarActions = () => {
  if (!isLogin.value) {
    goToLogin()
    return
  }
  uni.chooseImage({
    count: 1,
    success: (res) => {
      const filePath = res.tempFilePaths[0]
      memberStore.setProfile({
        ...memberStore.profile,
        avatar_url: filePath,
      })
      uni.showToast({ title: '头像已更新', icon: 'success' })
    },
  })
}

const openSettingsPopup = () => {
  if (!isLogin.value) {
    goToLogin()
    return
  }
  // Load current profile
  editForm.nickname = memberStore.profile?.nickname || ''
  editForm.mobile = memberStore.profile?.mobile || ''
  editForm.email = memberStore.profile?.email || ''
  editForm.collegeName = memberStore.profile?.collegeName || ''
  editForm.sex = memberStore.profile?.sex?.toString() || ''

  settingsPopupRef.value?.open?.('bottom')
}

const closeSettingsPopup = () => {
  settingsPopupRef.value?.close?.()
}

const saveSettings = async () => {
  if (!editForm.nickname.trim()) {
    uni.showToast({ title: '昵称不能为空', icon: 'none' })
    return
  }

  try {
    loading.value = true
    const updateData = {
      nickname: editForm.nickname.trim(),
      mobile: editForm.mobile.trim(),
      email: editForm.email.trim(),
      collegeName: editForm.collegeName.trim(),
      sex: editForm.sex,
      id: memberStore.profile?.id,
    }
    console.log(updateData, '-------------------')
    // 调用后端更新接口
    await updateUserInfo({
      ...(memberStore.profile || {}),
      ...updateData,
    })

    // 获取最新用户信息
    const res = await getCurrentUserInfo()

    // 更新 Store，(保留原来的token，用新数据覆盖)
    memberStore.setProfile({
      ...memberStore.profile,
      ...res.data,
    })

    uni.showToast({ title: '资料已保存', icon: 'success' })
    closeSettingsPopup()
  } catch (err) {
    // 接口错误已在 http 拦截中提示
  } finally {
    loading.value = false
  }
}

const showToast = (msg: string) => {
  uni.showToast({ title: msg, icon: 'none' })
}

const openPwdPopup = () => {
  if (!isLogin.value) {
    goToLogin()
    return
  }
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  pwdPopupRef.value?.open?.('bottom')
}

const closePwdPopup = () => {
  pwdPopupRef.value?.close?.()
}

const submitUpdatePwd = async () => {
  if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
    uni.showToast({ title: '请填写完整', icon: 'none' })
    return
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    uni.showToast({ title: '两次新密码不一致', icon: 'none' })
    return
  }
  try {
    loading.value = true
    await updatePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword,
      confirmPassword: pwdForm.confirmPassword,
    })
    uni.showToast({ title: '密码修改成功', icon: 'success' })
    closePwdPopup()
  } catch (err) {
    // API 自动提示了错误
  } finally {
    loading.value = false
  }
}

const handleResetPassword = () => {
  if (!isLogin.value) {
    goToLogin()
    return
  }
  const userId = memberStore.profile?.id
  if (!userId) {
    uni.showToast({ title: '获取用户信息失败', icon: 'none' })
    return
  }
  uni.showModal({
    title: '重置密码',
    content: '确定要重置密码吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          loading.value = true
          await resetPassword({ userId: String(userId) })
          uni.showToast({ title: '密码已重置', icon: 'success' })
        } catch (err) {
          // err handled in http interceptor
        } finally {
          loading.value = false
        }
      }
    },
  })
}

// Stats Real Data
const stats = ref({
  totalJoins: 0,
  favorites: 0,
  history: 0,
})

const behaviorTotal = computed(() => {
  return stats.value.totalJoins + stats.value.favorites + stats.value.history
})

const loadingList = ref(false)
const activityPopupRef = ref<any>()
const activeTab = ref<'favorite' | 'enter' | 'history'>('favorite')
const favoriteList = ref<any[]>([])
const enterList = ref<any[]>([])
const historyList = ref<any[]>([])

const activeList = computed(() => {
  if (activeTab.value === 'enter') return enterList.value
  if (activeTab.value === 'history') return historyList.value
  return favoriteList.value
})

const activeTitle = computed(() => {
  if (activeTab.value === 'enter') return '我的报名'
  if (activeTab.value === 'history') return '历史浏览'
  return '我的收藏'
})

const listEmptyText = computed(() => {
  if (activeTab.value === 'enter') return '暂无报名活动'
  if (activeTab.value === 'history') return '暂无浏览记录'
  return '暂无收藏活动'
})

const normalizeActivity = (item: any) => {
  const id = item.activityId || item.id
  return {
    id,
    activityId: item.activityId || item.id,
    name: item.activityName || item.name || '未命名活动',
    startTime: item.activityStartTime || item.startTime || '',
    endTime: item.activityEndTime || item.endTime || '',
    location: item.activityLocation || item.location || '待定',
    type: item.activityType || item.type || '',
    status: item.status || '',
  }
}

const formatTimeRange = (start?: string, end?: string) => {
  if (!start && !end) return '时间待定'
  if (start && end) return `${start} - ${end}`
  return start || end || '时间待定'
}

const openActivityPopup = (tab: 'favorite' | 'enter' | 'history') => {
  if (!isLogin.value) {
    goToLogin()
    return
  }
  activeTab.value = tab
  activityPopupRef.value?.open?.('bottom')
  loadActivityList(tab)
}

const loadActivityList = async (tab = activeTab.value) => {
  if (!memberStore.profile?.token) return
  loadingList.value = true
  try {
    if (tab === 'favorite') {
      const res: any = await getFavoriteList({
        pageNum: 1,
        pageSize: 20,
        query: { userId: memberStore.profile?.id, status: '已收藏' },
      })
      favoriteList.value = (res?.data?.records || []).map(normalizeActivity)
      return
    }

    if (tab === 'enter') {
      const res: any = await getEnterList({
        pageNum: 1,
        pageSize: 20,
        query: { userId: memberStore.profile?.id, status: '已报名' },
      })
      enterList.value = (res?.data?.records || []).map(normalizeActivity)
      return
    }

    const historyRes: any = await getViewList({
      pageNum: 1,
      pageSize: 20,
      query: { userId: memberStore.profile?.id },
    })
    historyList.value = (historyRes?.data?.records || []).map(normalizeActivity)
  } catch (err) {
    console.error('loadActivityList error', err)
  } finally {
    loadingList.value = false
  }
}

const goActivityDetail = (activityId: string) => {
  if (!activityId) return
  activityPopupRef.value?.close?.()
  uni.navigateTo({ url: `/pages/activity-detail/activity-detail?id=${activityId}` })
}

const chartData = computed(() => {
  const total = behaviorTotal.value
  const raw = [
    { key: 'totalJoins', label: '我的报名', value: stats.value.totalJoins, color: '#FF7A95' },
    { key: 'favorites', label: '我的收藏', value: stats.value.favorites, color: '#667EEA' },
    { key: 'history', label: '历史浏览', value: stats.value.history, color: '#27BA9B' },
  ]

  let cursor = 0
  return raw.map((item, index) => {
    const percent = total > 0 ? Number(((item.value / total) * 100).toFixed(1)) : 0
    const start = cursor
    const end = index === raw.length - 1 ? 100 : start + percent
    cursor = end
    return {
      ...item,
      percent,
      start,
      end,
    }
  })
})

const conicGradientStr = computed(() => {
  const stops = chartData.value.map((item) => `${item.color} ${item.start}% ${item.end}%`)
  return `conic-gradient(${stops.join(', ')})`
})

const loadMyStats = async () => {
  if (!memberStore.profile?.token) return

  try {
    const [behaviorRes, favoriteRes, enterRes]: any = await Promise.all([
      getUserBehaviorCount(),
      getFavoriteList({
        pageNum: 1,
        pageSize: 10,
        query: { userId: memberStore.profile?.id, status: '已收藏' },
      }),
      getEnterList({
        pageNum: 1,
        pageSize: 10,
        query: { userId: memberStore.profile?.id, status: '已报名' },
      }),
    ])

    const behavior = behaviorRes?.data || {}
    const favoriteTotal = Number(favoriteRes?.data?.total) || 0
    const enterTotal = Number(enterRes?.data?.total) || 0

    stats.value = {
      totalJoins: Number(behavior.enterCount) || enterTotal,
      favorites: Number(behavior.favoriteCount) || favoriteTotal,
      history: Number(behavior.viewCount) || 0,
    }
  } catch (err) {
    console.error('loadMyStats error', err)
  }
}

onShow(() => {
  if (!isLogin.value) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  loadMyStats()
})
</script>

<template>
  <view class="page">
    <!-- Top Hero Section -->
    <view class="hero-section">
      <view class="hero-profile">
        <!-- Avatar -->
        <!-- #ifdef MP-WEIXIN -->
        <button class="hero-avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <view class="hero-avatar">
            <image v-if="avatarSrc" :src="avatarSrc" mode="aspectFill" class="hero-avatar-img" />
            <text v-else class="hero-avatar-text">{{ displayName.charAt(0) }}</text>
          </view>
        </button>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <view class="hero-avatar" @tap="openAvatarActions">
          <image v-if="avatarSrc" :src="avatarSrc" mode="aspectFill" class="hero-avatar-img" />
          <text v-else class="hero-avatar-text">{{ displayName.charAt(0) }}</text>
        </view>
        <!-- #endif -->

        <!-- Info -->
        <view class="hero-info" @tap="openSettingsPopup">
          <text class="hero-name">{{ displayName }} <text class="edit-icon">✎</text></text>
          <view class="hero-tags">
            <text class="tag">{{ memberStore.profile?.collegeName || '未设置学院' }}</text>
            <text class="tag">{{ memberStore.profile?.mobile || '暂无手机号' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Content Area (Pulled up over the header) -->
    <view class="content-wrapper">
      <!-- Quick Navigation Grid -->
      <view class="quick-grid card">
        <view class="grid-item" @tap="openActivityPopup('favorite')">
          <text class="grid-num">{{ stats.favorites }}</text>
          <text class="grid-label">我的收藏</text>
        </view>
        <view class="grid-divider"></view>
        <view class="grid-item" @tap="openActivityPopup('history')">
          <text class="grid-num">{{ stats.history }}</text>
          <text class="grid-label">历史浏览</text>
        </view>
        <view class="grid-divider"></view>
        <view class="grid-item" @tap="openActivityPopup('enter')">
          <text class="grid-num">{{ stats.totalJoins }}</text>
          <text class="grid-label">我的报名</text>
        </view>
      </view>

      <!-- Activity Data Chart Module -->
      <view class="chart-card card">
        <text class="card-title">我的活动数据</text>
        <view class="chart-container">
          <!-- Donut Chart -->
          <view class="donut-chart" :style="{ background: conicGradientStr }">
            <view class="donut-hole">
              <text class="donut-total">{{ behaviorTotal }}</text>
              <text class="donut-label">行为总量</text>
            </view>
          </view>

          <!-- Legend -->
          <view class="chart-legend">
            <view class="legend-item" v-for="(item, index) in chartData" :key="index">
              <view class="color-dot" :style="{ background: item.color }"></view>
              <text class="legend-text">{{ item.label }}</text>
              <text class="legend-percent">{{ item.percent }}%</text>
            </view>
          </view>
        </view>
      </view>

      <!-- System Menu List -->
      <view class="menu-card card">
        <view class="menu-item" @tap="openSettingsPopup">
          <view class="menu-left">
            <text class="menu-icon">👤</text>
            <text class="menu-title">完善个人信息</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="openPwdPopup">
          <view class="menu-left">
            <text class="menu-icon">🔒</text>
            <text class="menu-title">修改密码</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="handleResetPassword">
          <view class="menu-left">
            <text class="menu-icon">🔑</text>
            <text class="menu-title">重置密码</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="showToast('意见反馈')">
          <view class="menu-left">
            <text class="menu-icon">💬</text>
            <text class="menu-title">意见反馈</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <!-- Logout Button (for demo purposes) -->
      <button class="logout-btn" @tap="memberStore.clearProfile(), goToLogin()">退出登录</button>
    </view>

    <!-- Settings / Profile Popup -->
    <uni-popup
      ref="settingsPopupRef"
      type="bottom"
      background-color="#fff"
      border-radius="40rpx 40rpx 0 0"
    >
      <view class="settings-popup">
        <view class="popup-header">
          <text class="popup-title">修改个人信息</text>
          <text class="popup-close" @tap="closeSettingsPopup">×</text>
        </view>
        <view class="popup-body">
          <view class="form-group">
            <text class="form-label">昵称</text>
            <!-- #ifdef MP-WEIXIN -->
            <input
              class="form-input"
              type="nickname"
              v-model="editForm.nickname"
              placeholder="请输入你的昵称"
            />
            <!-- #endif -->
            <!-- #ifndef MP-WEIXIN -->
            <input
              class="form-input"
              type="text"
              v-model="editForm.nickname"
              placeholder="请输入你的昵称"
            />
            <!-- #endif -->
          </view>

          <view class="form-group">
            <text class="form-label">手机号</text>
            <input
              class="form-input"
              type="number"
              v-model="editForm.mobile"
              placeholder="请输入你的手机号"
              maxlength="11"
            />
          </view>

          <view class="form-group">
            <text class="form-label">电子邮箱</text>
            <input
              class="form-input"
              type="text"
              v-model="editForm.email"
              placeholder="请输入电子邮箱"
            />
          </view>

          <view class="form-group">
            <text class="form-label">性别 (选填)</text>
            <input class="form-input" type="text" v-model="editForm.sex" placeholder="男 / 女" />
          </view>

          <view class="form-group">
            <text class="form-label">学院</text>
            <input
              class="form-input"
              type="text"
              v-model="editForm.collegeName"
              placeholder="例如：计算机学院"
            />
          </view>
        </view>

        <view class="popup-footer">
          <button class="save-btn" @tap="saveSettings">保存资料</button>
        </view>
      </view>
    </uni-popup>

    <!-- Password Popup -->
    <uni-popup
      ref="pwdPopupRef"
      type="bottom"
      background-color="#fff"
      border-radius="40rpx 40rpx 0 0"
    >
      <view class="settings-popup">
        <view class="popup-header">
          <text class="popup-title">修改密码</text>
          <text class="popup-close" @tap="closePwdPopup">×</text>
        </view>
        <view class="popup-body">
          <view class="form-group">
            <text class="form-label">旧密码</text>
            <input
              class="form-input"
              type="password"
              v-model="pwdForm.oldPassword"
              placeholder="请输入旧密码"
            />
          </view>

          <view class="form-group">
            <text class="form-label">新密码</text>
            <input
              class="form-input"
              type="password"
              v-model="pwdForm.newPassword"
              placeholder="请输入新密码"
            />
          </view>

          <view class="form-group">
            <text class="form-label">确认新密码</text>
            <input
              class="form-input"
              type="password"
              v-model="pwdForm.confirmPassword"
              placeholder="请再次输入新密码"
            />
          </view>
        </view>

        <view class="popup-footer">
          <button class="save-btn" @tap="submitUpdatePwd" :disabled="loading">确认修改</button>
        </view>
      </view>
    </uni-popup>

    <uni-popup
      ref="activityPopupRef"
      type="bottom"
      background-color="#fff"
      border-radius="32rpx 32rpx 0 0"
    >
      <view class="activity-popup">
        <view class="popup-header">
          <text class="popup-title">{{ activeTitle }}</text>
          <text class="popup-close" @tap="activityPopupRef?.close?.()">×</text>
        </view>

        <view class="activity-tabs">
          <view
            class="tab-item"
            :class="{ active: activeTab === 'favorite' }"
            @tap="
              activeTab = 'favorite'
              loadActivityList('favorite')
            "
          >
            我的收藏
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === 'enter' }"
            @tap="
              activeTab = 'enter'
              loadActivityList('enter')
            "
          >
            我的报名
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === 'history' }"
            @tap="
              activeTab = 'history'
              loadActivityList('history')
            "
          >
            历史浏览
          </view>
        </view>

        <scroll-view scroll-y class="activity-list-scroll">
          <view v-if="loadingList" class="list-placeholder">加载中...</view>
          <view v-else-if="!activeList.length" class="list-placeholder">{{ listEmptyText }}</view>
          <view
            v-else
            class="activity-card"
            v-for="item in activeList"
            :key="`${activeTab}-${item.id}`"
            @tap="goActivityDetail(item.activityId)"
          >
            <view class="activity-card-header">
              <text class="activity-title">{{ item.name }}</text>
              <text class="activity-type" v-if="item.type">{{ item.type }}</text>
            </view>
            <text class="activity-time">{{ formatTimeRange(item.startTime, item.endTime) }}</text>
            <view class="activity-card-footer">
              <text class="activity-location">{{ item.location || '地点待定' }}</text>
              <text class="activity-status" v-if="item.status">{{ item.status }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </uni-popup>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #f7f9fc;
  padding-bottom: 40rpx;
}

/* Header Section */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 100rpx 40rpx 100rpx;
  /* Extra bottom padding for overlap */
  color: #fff;
  border-bottom-left-radius: 40rpx;
  border-bottom-right-radius: 40rpx;
}

.hero-profile {
  display: flex;
  align-items: center;

  .hero-avatar-btn {
    padding: 0;
    margin: 0;
    background: none;
    line-height: 1;

    &::after {
      border: none;
    }
  }

  .hero-avatar {
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: 4rpx solid rgba(255, 255, 255, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    backdrop-filter: blur(10rpx);

    .hero-avatar-img {
      width: 100%;
      height: 100%;
    }

    .hero-avatar-text {
      font-size: 60rpx;
      font-weight: bold;
      color: #fff;
    }
  }

  .hero-info {
    margin-left: 30rpx;
    flex: 1;

    .hero-name {
      font-size: 40rpx;
      font-weight: bold;
      display: flex;
      align-items: center;

      .edit-icon {
        font-size: 28rpx;
        margin-left: 10rpx;
        opacity: 0.8;
      }
    }

    .hero-tags {
      display: flex;
      gap: 16rpx;
      margin-top: 16rpx;

      .tag {
        font-size: 22rpx;
        background: rgba(255, 255, 255, 0.2);
        padding: 4rpx 16rpx;
        border-radius: 20rpx;
        backdrop-filter: blur(4rpx);
      }
    }
  }
}

/* Content Wrapper */
.content-wrapper {
  padding: 0 30rpx;
  margin-top: -60rpx;
  /* Pulled up over header */
  position: relative;
  z-index: 10;
}

.card {
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
  margin-bottom: 30rpx;
}

/* Quick Grid */
.quick-grid {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 40rpx 0;

  .grid-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;

    &:active {
      opacity: 0.7;
    }

    .grid-num {
      font-size: 44rpx;
      font-weight: bold;
      color: #222;
      margin-bottom: 8rpx;
    }

    .grid-label {
      font-size: 24rpx;
      color: #666;
    }
  }

  .grid-divider {
    width: 2rpx;
    height: 60rpx;
    background-color: #eee;
  }
}

/* Chart Card */
.chart-card {
  padding: 30rpx;

  .card-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #222;
    margin-bottom: 30rpx;
    display: block;
  }

  .chart-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20rpx;

    /* CSS Donut Chart Implementation */
    .donut-chart {
      width: 220rpx;
      height: 220rpx;
      border-radius: 50%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

      .donut-hole {
        width: 140rpx;
        height: 140rpx;
        border-radius: 50%;
        background-color: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .donut-total {
          font-size: 36rpx;
          font-weight: bold;
          color: #333;
        }

        .donut-label {
          font-size: 20rpx;
          color: #999;
          margin-top: 4rpx;
        }
      }
    }

    /* Legend */
    .chart-legend {
      display: flex;
      flex-direction: column;
      gap: 20rpx;
      flex: 1;
      margin-left: 60rpx;

      .legend-item {
        display: flex;
        align-items: center;

        .color-dot {
          width: 16rpx;
          height: 16rpx;
          border-radius: 50%;
          margin-right: 12rpx;
        }

        .legend-text {
          font-size: 26rpx;
          color: #666;
          flex: 1;
        }

        .legend-percent {
          font-size: 28rpx;
          font-weight: bold;
          color: #333;
        }
      }
    }
  }
}

/* Menu List */
.menu-card {
  padding: 0 10rpx;

  .menu-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx 20rpx;
    border-bottom: 1rpx solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    &:active {
      background-color: #f9f9f9;
    }

    .menu-left {
      display: flex;
      align-items: center;

      .menu-icon {
        font-size: 36rpx;
        margin-right: 20rpx;
      }

      .menu-title {
        font-size: 30rpx;
        color: #333;
      }
    }

    .menu-arrow {
      font-size: 40rpx;
      color: #ccc;
    }
  }
}

.logout-btn {
  margin-top: 40rpx;
  background-color: #fff;
  border-radius: 20rpx;
  color: #ff4d4f;
  font-size: 30rpx;
  font-weight: bold;
  height: 90rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);

  &:active {
    opacity: 0.8;
  }
}

/* Settings Popup */
.settings-popup {
  padding: 40rpx 40rpx calc(60rpx + env(safe-area-inset-bottom));
  max-height: 80vh;

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40rpx;

    .popup-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #222;
    }

    .popup-close {
      font-size: 50rpx;
      color: #999;
      line-height: 1;
    }
  }

  .popup-body {
    display: flex;
    flex-direction: column;
    gap: 30rpx;

    .form-group {
      .form-label {
        font-size: 28rpx;
        color: #666;
        margin-bottom: 12rpx;
        display: block;
      }

      .form-input {
        background-color: #f5f7fa;
        height: 88rpx;
        border-radius: 20rpx;
        padding: 0 30rpx;
        font-size: 30rpx;
        color: #333;
        transition: all 0.3s;

        &:focus {
          border: 1px solid #667eea;
          background-color: #fff;
        }
      }
    }
  }

  .popup-footer {
    margin-top: 50rpx;

    .save-btn {
      width: 100%;
      height: 90rpx;
      border-radius: 45rpx;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      font-size: 32rpx;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10rpx 20rpx rgba(102, 126, 234, 0.3);

      &:active {
        transform: scale(0.98);
        opacity: 0.9;
      }
    }
  }
}

.activity-popup {
  padding: 28rpx 28rpx calc(28rpx + env(safe-area-inset-bottom));
  max-height: 75vh;

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 22rpx;

    .popup-title {
      font-size: 34rpx;
      font-weight: 700;
      color: #222;
    }

    .popup-close {
      font-size: 48rpx;
      color: #999;
      line-height: 1;
    }
  }

  .activity-tabs {
    display: flex;
    background: #f5f7fa;
    border-radius: 16rpx;
    padding: 8rpx;
    margin-bottom: 20rpx;

    .tab-item {
      flex: 1;
      text-align: center;
      font-size: 25rpx;
      color: #666;
      padding: 14rpx 0;
      border-radius: 12rpx;

      &.active {
        background: #fff;
        color: #3a64e8;
        font-weight: 700;
      }
    }
  }

  .activity-list-scroll {
    max-height: 56vh;
  }

  .list-placeholder {
    text-align: center;
    color: #999;
    font-size: 26rpx;
    padding: 80rpx 0;
  }

  .activity-card {
    background: #fff;
    border-radius: 18rpx;
    padding: 24rpx;
    box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.05);
    margin-bottom: 16rpx;

    &:active {
      opacity: 0.85;
    }

    .activity-card-header {
      display: flex;
      justify-content: space-between;
      gap: 12rpx;
      align-items: center;
      margin-bottom: 12rpx;

      .activity-title {
        font-size: 30rpx;
        color: #222;
        font-weight: 700;
        flex: 1;
      }

      .activity-type {
        font-size: 22rpx;
        color: #3a64e8;
        background: #eef3ff;
        padding: 6rpx 12rpx;
        border-radius: 999rpx;
      }
    }

    .activity-time {
      display: block;
      font-size: 24rpx;
      color: #666;
      margin-bottom: 12rpx;
    }

    .activity-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .activity-location {
        font-size: 24rpx;
        color: #888;
      }

      .activity-status {
        font-size: 22rpx;
        color: #ff7a45;
        background: #fff4eb;
        padding: 6rpx 12rpx;
        border-radius: 999rpx;
      }
    }
  }
}
</style>
