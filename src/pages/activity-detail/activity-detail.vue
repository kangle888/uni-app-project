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
            >
            </view>
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
import {
  getActivityDetail,
  enterActivity,
  cancelActivity,
  getRegistrationRule,
  getSignCode,
} from '@/services/activity'

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
  registrationRuleId?: string
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
  registrationRuleId: undefined,
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
  fetchDetail(id)
})

const formatTimeRange = (start?: string, end?: string) => {
  if (!start && !end) return ''
  const s = start ? new Date(start) : null
  const e = end ? new Date(end) : null
  if (s && e) return `${s.toLocaleString('zh-CN')} - ${e.toLocaleString('zh-CN')}`
  if (s) return s.toLocaleString('zh-CN')
  return e ? e.toLocaleString('zh-CN') : ''
}

const fetchDetail = async (id: string | number) => {
  try {
    uni.showLoading({ title: '加载中...' })
    const res = await getActivityDetail(String(id))
    const d: any = res.data

    activityData.value = {
      id: d.id,
      title: d.name || d.title || '活动详情',
      cover: d.image1 || d.image2 || d.image3 || '',
      status: d.status || '',
      statusType:
        (d.status && String(d.status).includes('结束')) || (d.number && d.hot >= d.number)
          ? 'disabled'
          : 'active',
      categoryName: d.type || '',
      tags: [],
      time: formatTimeRange(d.startTime, d.endTime),
      location: d.address || '',
      organizer: d.organizer || '',
      joined: Number(d.hot) || 0,
      capacity: Number(d.number) || 0,
      description: d.description || '',
      rules: d.rule || (d.registrationRule && d.registrationRule.description) || undefined,
      registrationRuleId:
        d.registrationRuleId ||
        d.ruleId ||
        (d.registrationRule && d.registrationRule.id) ||
        undefined,
      isFavorited: false,
      // try multiple possible flags returned by backend to infer enrollment
      isEnrolled: !!(
        d.isEnter ||
        d.entered ||
        d.hasEnter ||
        d.isEnrolled ||
        d.joinFlag ||
        d.enrolled
      ),
      needsCheckin: !!(d.registrationRuleId || d.ruleId || d.registrationRule),
    }
  } catch (err) {
    console.error('fetchDetail error', err)
  } finally {
    uni.hideLoading()
  }
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

const handleCheckin = async () => {
  if (!activityData.value.isEnrolled) {
    uni.showToast({ title: '请先报名活动后再打卡', icon: 'none' })
    return
  }

  try {
    uni.showLoading({ title: '获取签到规则...' })
    // determine rule id (prefer explicit rule id if available)
    const ruleId = activityData.value.registrationRuleId || String(activityData.value.id)
    const ruleRes = await getRegistrationRule(String(ruleId))
    const ruleData: any = ruleRes?.data

    // If backend returned signBegin/signEnd, validate current time against them
    if (ruleData) {
      const now = Date.now()
      const begin = ruleData.signBegin ? new Date(ruleData.signBegin).getTime() : undefined
      const end = ruleData.signEnd ? new Date(ruleData.signEnd).getTime() : undefined
      if (begin && now < begin) {
        uni.showToast({ title: '未到签到开始时间', icon: 'none' })
        return
      }
      if (end && now > end && ruleData.allowLateSign !== 'true') {
        uni.showToast({ title: '签到已结束', icon: 'none' })
        return
      }
    }

    // 获取签到二维码
    uni.showLoading({ title: '生成签到二维码...' })
    const codeRes = await getSignCode(String(activityData.value.id))
    const codeData: any = codeRes?.data
    uni.hideLoading()

    // 如果返回二维码图片地址，使用图片预览展示；若返回 signCode，则显示文本
    if (codeData && codeData.qrUrl) {
      uni.previewImage({ urls: [codeData.qrUrl] })
    } else if (codeData && codeData.signCode) {
      uni.showModal({ title: '签到二维码', content: `签到码：${codeData.signCode}` })
    } else if (typeof codeRes?.data === 'string') {
      // 有些后端直接返回图片地址字符串
      uni.previewImage({ urls: [String(codeRes.data)] })
    } else {
      uni.showToast({ title: '未能获取签到信息', icon: 'none' })
    }
  } catch (err) {
    console.error('checkin error', err)
    uni.showToast({ title: '获取签到失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const handleEnroll = async () => {
  uni.showModal({
    title: '确认报名',
    content: `是否确认报名参加《${activityData.value.title.substring(0, 10)}...》？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中' })
          await enterActivity(String(activityData.value.id))
          activityData.value.isEnrolled = true
          activityData.value.joined += 1
          uni.showToast({ title: '报名成功', icon: 'success' })
        } catch (err) {
          console.error('enroll error', err)
        } finally {
          uni.hideLoading()
        }
      }
    },
  })
}

const handleCancelEnroll = () => {
  uni.showModal({
    title: '取消报名',
    content: '取消后可能无法再次获得名额，是否确认取消？',
    confirmColor: '#FF4D4F',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中' })
          await cancelActivity(String(activityData.value.id))
          activityData.value.isEnrolled = false
          activityData.value.joined = Math.max(0, activityData.value.joined - 1)
          uni.showToast({ title: '已取消报名', icon: 'none' })
        } catch (err) {
          console.error('cancel enroll error', err)
        } finally {
          uni.hideLoading()
        }
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
  margin-top: -60rpx;
  /* overlap with hero */
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
      white-space: pre-wrap;
      /* Keeps newlines intact */
    }
  }
}

.bottom-spacer {
  height: 140rpx;
  /* Space for action bar */
}

/* Bottom Action Bar */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 180rpx;
  background-color: #ffffff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40rpx;
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
