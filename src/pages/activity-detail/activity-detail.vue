<template>
  <view class="activity-detail-page">
    <!-- Hero Cover -->
    <view class="hero-section">
      <image :src="activityData.cover" mode="aspectFill" class="hero-image"></image>
      <view class="hero-overlay"></view>
      <view class="status-badge" :class="activityData.statusType">
        {{ activityData.status }}
      </view>
    </view>

    <!-- Main Content -->
    <view class="content-wrapper">
      <!-- Title Card -->
      <view class="title-card card">
        <text class="activity-title">{{ activityData.title }}</text>
        <view class="tags-row">
          <text class="tag category">{{ activityData.categoryName }}</text>
          <text class="tag" v-for="(tag, index) in activityData.tags" :key="index">{{ tag }}</text>
        </view>
      </view>

      <!-- Info Details -->
      <view class="info-card card">
        <view class="info-row">
          <view class="icon-wrap"><text class="icon">🕒</text></view>
          <view class="text-wrap">
            <text class="info-label">活动时间</text>
            <text class="info-value">{{ activityData.time }}</text>
          </view>
        </view>
        <view class="info-row">
          <view class="icon-wrap"><text class="icon">📍</text></view>
          <view class="text-wrap">
            <text class="info-label">活动地点</text>
            <text class="info-value">{{ activityData.location }}</text>
          </view>
        </view>
        <view class="info-row">
          <view class="icon-wrap"><text class="icon">👤</text></view>
          <view class="text-wrap">
            <text class="info-label">主办方</text>
            <text class="info-value">{{ activityData.organizer }}</text>
          </view>
        </view>
      </view>

      <!-- Registration Progress bar -->
      <view class="progress-card card">
        <view class="progress-header">
          <text class="progress-title">报名进度</text>
          <text class="progress-count"
            ><text class="highlight">{{ activityData.joined }}</text> /
            {{ activityData.capacity }} 人</text
          >
        </view>
        <view class="progress-bar-container">
          <view class="progress-bar-bg">
            <view
              class="progress-bar-fill"
              :style="{ width: enrollmentPercent + '%', backgroundColor: progressColor }"
            ></view>
          </view>
        </view>
        <text class="progress-tip" :style="{ color: progressColor }">{{ progressTip }}</text>
      </view>

      <!-- Description Body -->
      <view class="desc-card card">
        <text class="section-title">活动详情</text>
        <view class="rich-text-content">
          <text class="paragraph">{{ activityData.description }}</text>
          <text class="paragraph" v-if="activityData.rules"
            >【活动要求】\n{{ activityData.rules }}</text
          >
        </view>
      </view>

      <!-- Spacer for bottom action bar -->
      <view class="bottom-spacer"></view>
    </view>

    <!-- Bottom Action Bar -->
    <view class="action-bar">
      <view class="action-left">
        <view class="action-icon-btn" @tap="toggleFavorite">
          <text class="icon">{{ activityData.isFavorited ? '❤️' : '🤍' }}</text>
          <text class="icon-label" :class="{ 'active-label': activityData.isFavorited }">{{
            activityData.isFavorited ? '已收藏' : '收藏'
          }}</text>
        </view>

        <view class="action-icon-btn" v-if="activityData.needsCheckin" @tap="handleCheckin">
          <text class="icon">📍</text>
          <text class="icon-label">去打卡</text>
        </view>
      </view>

      <view class="action-right">
        <!-- Main dynamic button based on status -->
        <button
          v-if="activityData.statusType === 'active' && !activityData.isEnrolled"
          class="main-btn primary"
          @tap="handleEnroll"
        >
          立即报名
        </button>
        <button
          v-else-if="activityData.isEnrolled && activityData.statusType !== 'disabled'"
          class="main-btn warning"
          @tap="handleCancelEnroll"
        >
          取消报名
        </button>
        <button v-else class="main-btn disabled" disabled>
          {{ activityData.statusType === 'disabled' ? '活动结束' : '名额已满' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// Note: In a real app, you would fetch details via HTTP using the ID passed in onLoad.
// For now, we mock the detailed data.

interface ActivityDetail {
  id: number | string
  title: string
  cover: string
  status: string
  statusType: 'active' | 'warning' | 'disabled'
  categoryName: string
  tags: string[]
  time: string
  location: string
  organizer: string
  joined: number
  capacity: number
  description: string
  rules?: string
  isFavorited: boolean
  isEnrolled: boolean
  needsCheckin: boolean
}

const activityData = ref<ActivityDetail>({
  id: 0,
  title: '加载中...',
  cover: '',
  status: '',
  statusType: 'disabled',
  categoryName: '',
  tags: [],
  time: '',
  location: '',
  organizer: '',
  joined: 0,
  capacity: 100,
  description: '',
  isFavorited: false,
  isEnrolled: false,
  needsCheckin: false,
})

// Computed properties for progress bar
const enrollmentPercent = computed(() => {
  if (activityData.value.capacity === 0) return 0
  const pct = (activityData.value.joined / activityData.value.capacity) * 100
  return Math.min(100, Math.max(0, pct))
})

const progressColor = computed(() => {
  const pct = enrollmentPercent.value
  if (pct >= 100) return '#999999' // Full/Disabled grey
  if (pct >= 80) return '#FAAD14' // Warning Orange
  return '#27BA9B' // Active Green
})

const progressTip = computed(() => {
  const pct = enrollmentPercent.value
  if (pct >= 100) return '名额已满，无法报名了哦'
  if (pct >= 80) return '名额紧张，手慢无！'
  return '名额充足，快来参加吧'
})

onLoad((options) => {
  const id = options?.id || '1'
  fetchMockDetail(id)
})

const fetchMockDetail = (id: string | number) => {
  // Mock data simulation based on ID
  // In reality, replace this with your HTTP request: `const res = await http({ url: `/activity/${id}` })`
  uni.showLoading({ title: '加载中...' })

  setTimeout(() => {
    activityData.value = {
      id,
      title: '“青春律动” 校园街舞争霸赛决赛，邀你共同见证冠军诞生',
      cover:
        'https://images.unsplash.com/photo-1518834107812-6aed9cecdbb4?q=80&w=800&auto=format&fit=crop',
      status: '报名中',
      statusType: 'active',
      categoryName: '文艺演出',
      tags: ['街舞', '综测加分+', '校级'],
      time: '2026年10月24日 (本周五) 18:30 - 21:00',
      location: '大学生活动中心 - 主舞台',
      organizer: '校团委 & 街舞社',
      joined: 178,
      capacity: 200,
      description:
        '燃爆全场的青春战歌！本届“青春律动”校园街舞争霸赛历时一个月，经过激烈的海选、初赛与半决赛，最终有十二支顶尖校园战队脱颖而出，杀入总决赛。\n\n届时不仅有震撼的齐舞表演，还会有1v1 Battle，不容错过的视听盛宴！欢迎全体师生前来观摩打Call！',
      rules:
        '1. 请提前15分钟验票入场，切勿大声喧哗影响他人观演。\n2. 如无法参加，请至少提前 2 小时取消报名，释放名额。',
      isFavorited: false,
      isEnrolled: false,
      needsCheckin: true,
    }
    uni.hideLoading()
  }, 500)
}

// Action Handlers
const toggleFavorite = () => {
  activityData.value.isFavorited = !activityData.value.isFavorited
  uni.showToast({
    title: activityData.value.isFavorited ? '已加入收藏' : '已取消收藏',
    icon: 'success',
    duration: 1500,
  })
}

const handleCheckin = () => {
  if (!activityData.value.isEnrolled) {
    uni.showToast({ title: '请先报名活动后再打卡', icon: 'none' })
    return
  }
  // Mock Check-in Logic
  uni.showLoading({ title: '定位中...' })
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: '打卡成功！', icon: 'success' })
  }, 800)
}

const handleEnroll = () => {
  // Mock Enroll
  uni.showModal({
    title: '确认报名',
    content: `是否确认报名参加《${activityData.value.title.substring(0, 10)}...》？`,
    success: (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '处理中' })
        setTimeout(() => {
          activityData.value.isEnrolled = true
          activityData.value.joined += 1
          uni.hideLoading()
          uni.showToast({ title: '报名成功', icon: 'success' })
        }, 600)
      }
    },
  })
}

const handleCancelEnroll = () => {
  uni.showModal({
    title: '取消报名',
    content: '取消后可能无法再次获得名额，是否确认取消？',
    confirmColor: '#FF4D4F',
    success: (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '处理中' })
        setTimeout(() => {
          activityData.value.isEnrolled = false
          activityData.value.joined = Math.max(0, activityData.value.joined - 1)
          uni.hideLoading()
          uni.showToast({ title: '已取消报名', icon: 'none' })
        }, 600)
      }
    },
  })
}
</script>

<style lang="scss" scoped>
.activity-detail-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* Hero Cover */
.hero-section {
  position: relative;
  width: 100%;
  height: 480rpx;

  .hero-image {
    width: 100%;
    height: 100%;
    display: block;
  }

  .hero-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 160rpx;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.6) 100%);
  }

  .status-badge {
    position: absolute;
    top: 30rpx;
    right: 30rpx;
    padding: 8rpx 20rpx;
    border-radius: 30rpx;
    font-size: 24rpx;
    font-weight: bold;
    color: #fff;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8rpx);

    &.active {
      background: rgba(39, 186, 155, 0.9);
    }
    &.warning {
      background: rgba(250, 173, 20, 0.9);
    }
    &.disabled {
      background: rgba(153, 153, 153, 0.9);
    }
  }
}

/* Content Layout */
.content-wrapper {
  position: relative;
  z-index: 10;
  margin-top: -60rpx; /* overlap with hero */
  padding: 0 30rpx;
}

.card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 30rpx;
}

/* Title Card */
.title-card {
  .activity-title {
    font-size: 38rpx;
    font-weight: bold;
    color: #222;
    line-height: 1.4;
    display: block;
    margin-bottom: 20rpx;
  }

  .tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;

    .tag {
      font-size: 22rpx;
      color: #667eea;
      background: rgba(102, 126, 234, 0.1);
      padding: 6rpx 16rpx;
      border-radius: 8rpx;

      &.category {
        color: #fff;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
    }
  }
}

/* Info Details */
.info-card {
  display: flex;
  flex-direction: column;
  gap: 24rpx;

  .info-row {
    display: flex;
    align-items: flex-start;

    .icon-wrap {
      width: 48rpx;
      padding-top: 4rpx;
      .icon {
        font-size: 32rpx;
      }
    }

    .text-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6rpx;

      .info-label {
        font-size: 24rpx;
        color: #999;
      }

      .info-value {
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
        line-height: 1.4;
      }
    }
  }
}

/* Progress Bar */
.progress-card {
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .progress-title {
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
    }

    .progress-count {
      font-size: 26rpx;
      color: #666;
      .highlight {
        color: #27ba9b;
        font-weight: bold;
        font-size: 32rpx;
      }
    }
  }

  .progress-bar-container {
    height: 16rpx;
    width: 100%;
    margin-bottom: 16rpx;

    .progress-bar-bg {
      width: 100%;
      height: 100%;
      background-color: #f0f0f0;
      border-radius: 8rpx;
      overflow: hidden;

      .progress-bar-fill {
        height: 100%;
        border-radius: 8rpx;
        transition: width 0.8s cubic-bezier(0.25, 0.8, 0.25, 1);
      }
    }
  }

  .progress-tip {
    font-size: 22rpx;
    display: block;
    text-align: right;
  }
}

/* Description */
.desc-card {
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 24rpx;
    display: block;
    position: relative;
    padding-left: 16rpx;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 6rpx;
      height: 28rpx;
      background-color: #667eea;
      border-radius: 4rpx;
    }
  }

  .rich-text-content {
    .paragraph {
      font-size: 28rpx;
      color: #555;
      line-height: 1.6;
      display: block;
      margin-bottom: 20rpx;
      white-space: pre-wrap; /* Keeps newlines intact */
    }
  }
}

.bottom-spacer {
  height: 140rpx; /* Space for action bar */
}

/* Bottom Action Bar */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 120rpx;
  background-color: #ffffff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40rpx;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
  box-sizing: border-box;

  .action-left {
    display: flex;
    gap: 40rpx;

    .action-icon-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      &:active {
        opacity: 0.6;
      }

      .icon {
        font-size: 40rpx;
        margin-bottom: 4rpx;
      }

      .icon-label {
        font-size: 20rpx;
        color: #666;

        &.active-label {
          color: #ff4d4f;
          font-weight: bold;
        }
      }
    }
  }

  .action-right {
    flex: 1;
    display: flex;
    justify-content: flex-end;

    .main-btn {
      width: 280rpx;
      height: 80rpx;
      line-height: 80rpx;
      border-radius: 40rpx;
      font-size: 30rpx;
      font-weight: bold;
      color: #fff;
      margin: 0;
      box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.1);

      &.primary {
        background: linear-gradient(135deg, #27ba9b 0%, #1f8ef1 100%);
        box-shadow: 0 6rpx 16rpx rgba(39, 186, 155, 0.3);
      }

      &.warning {
        background: #fff;
        color: #ff4d4f;
        border: 2rpx solid #ff4d4f;
        box-shadow: none;
      }

      &.disabled {
        background: #cccccc;
        color: #ffffff;
        box-shadow: none;
      }

      &:active {
        transform: scale(0.96);
      }
    }
  }
}
</style>
