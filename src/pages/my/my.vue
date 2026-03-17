<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useMemberStore } from '@/stores'

const memberStore = useMemberStore()
const loading = ref(false)

// State for settings popup
const settingsPopupRef = ref<any>()
const editForm = reactive({
  nickname: '',
  mobile: '',
  email: '',
  college_name: '',
  sex: '',
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
  // Load curreconst openSettingsPopup = () => {
  editForm.nickname = memberStore.profile?.nickname || ''
  editForm.mobile = memberStore.profile?.mobile || ''
  editForm.email = memberStore.profile?.email || ''
  editForm.college_name = memberStore.profile?.college_name || ''
  editForm.sex = memberStore.profile?.sex?.toString() || ''

  settingsPopupRef.value?.open?.('bottom')
}

const closeSettingsPopup = () => {
  settingsPopupRef.value?.close?.()
}

const saveSettings = () => {
  if (!editForm.nickname.trim()) {
    uni.showToast({ title: '昵称不能为空', icon: 'none' })
    return
  }

  // 模拟保存到 Store (实际应该调用后端更新接口)
  memberStore.setProfile({
    ...memberStore.profile,
    nickname: editForm.nickname.trim(),
    mobile: editForm.mobile.trim(),
    email: editForm.email.trim(),
    college_name: editForm.college_name.trim(),
    sex: editForm.sex,
  })

  uni.showToast({ title: '资料已保存', icon: 'success' })
  closeSettingsPopup()
}

const showToast = (msg: string) => {
  uni.showToast({ title: msg, icon: 'none' })
}

// Stats Dummy Data
const stats = ref({
  totalJoins: 12,
  favorites: 8,
  history: 45,
})

// Chart Data Dummy Logic (conic-gradient needs a string)
const chartData = [
  { label: '体育竞技', percent: 40, color: '#FF7A95', start: 0, end: 40 },
  { label: '学术讲座', percent: 35, color: '#667EEA', start: 40, end: 75 },
  { label: '文艺演出', percent: 25, color: '#27BA9B', start: 75, end: 100 },
]

const conicGradientStr = computed(() => {
  // 生成锥形渐变字符串: e.g. #FF7A95 0% 40%, #667EEA 40% 75%, #27BA9B 75% 100%
  const stops = chartData.map((item) => `${item.color} ${item.start}% ${item.end}%`)
  return `conic-gradient(${stops.join(', ')})`
})

onShow(() => {
  if (!isLogin.value) {
    uni.reLaunch({ url: '/pages/login/login' })
  }
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
            <text class="tag">{{ memberStore.profile?.college_name || '未设置学院' }}</text>
            <text class="tag">{{ memberStore.profile?.mobile || '暂无手机号' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Content Area (Pulled up over the header) -->
    <view class="content-wrapper">
      <!-- Quick Navigation Grid -->
      <view class="quick-grid card">
        <view class="grid-item" @tap="showToast('我的收藏')">
          <text class="grid-num">{{ stats.favorites }}</text>
          <text class="grid-label">我的收藏</text>
        </view>
        <view class="grid-divider"></view>
        <view class="grid-item" @tap="showToast('历史浏览')">
          <text class="grid-num">{{ stats.history }}</text>
          <text class="grid-label">历史浏览</text>
        </view>
        <view class="grid-divider"></view>
        <view class="grid-item" @tap="showToast('我的报名')">
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
              <text class="donut-total">{{ stats.totalJoins }}</text>
              <text class="donut-label">总参与量</text>
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
        <view class="menu-item" @tap="showToast('意见反馈')">
          <view class="menu-left">
            <text class="menu-icon">💬</text>
            <text class="menu-title">意见反馈</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <!-- Logout Button (for demo purposes) -->
      <button
        class="logout-btn"
        @tap="
          memberStore.clearProfile()
          goToLogin()
        "
      >
        退出登录
      </button>
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
              v-model="editForm.college_name"
              placeholder="例如：计算机学院"
            />
          </view>
        </view>

        <view class="popup-footer">
          <button class="save-btn" @tap="saveSettings">保存资料</button>
        </view>
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
  padding: 100rpx 40rpx 100rpx; /* Extra bottom padding for overlap */
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
  margin-top: -60rpx; /* Pulled up over header */
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
</style>
