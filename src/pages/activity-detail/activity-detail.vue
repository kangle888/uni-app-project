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

        <view class="action-icon-btn" @tap="openCommentPopup">
          <text class="icon">💬</text>
          <text class="icon-label">评论</text>
        </view>

        <view
          v-if="activityData.needsCheckin"
          class="action-icon-btn"
          @tap="isSignedIn ? undefined : isAdmin ? handleScanVerify() : handleCheckin()"
        >
          <text class="icon">📍</text>
          <text class="icon-label" :class="{ 'active-label': isSignedIn }">{{
            isSignedIn ? '已签到' : isAdmin ? '扫码核验' : '签到'
          }}</text>
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
        <button v-else-if="isSignedIn" class="main-btn signed" disabled>已报名</button>
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

    <!-- Checkin QR Code Modal -->
    <view v-if="qrVisible" class="qr-modal" @tap.self="closeQr">
      <view class="qr-dialog">
        <text class="qr-title">签到二维码</text>
        <image v-if="qrDataUrl" :src="qrDataUrl" class="qr-image" mode="widthFix" />
        <!-- <text class="qr-text" v-if="qrToken">{{ qrToken }}</text> -->
        <text class="qr-error" v-if="qrError">{{ qrError }}</text>
        <view class="qr-actions">
          <button class="qr-close" @tap="closeQr">关闭</button>
        </view>
      </view>
    </view>

    <!-- Comment Popup -->
    <view v-if="commentVisible" class="comment-popup-mask" @tap.self="closeCommentPopup">
      <view class="comment-popup">
        <view class="comment-popup-header">
          <text class="comment-popup-title">活动评论</text>
          <text class="comment-popup-close" @tap="closeCommentPopup">×</text>
        </view>

        <view class="comment-popup-body">
          <view class="comment-list" v-if="comments.length">
            <view class="comment-item" v-for="item in comments" :key="item.id">
              <text class="comment-user">{{ item.nickname || item.userName || '同学' }}</text>
              <text class="comment-content">{{ item.content }}</text>
              <text class="comment-time">{{ item.createTime || '' }}</text>
            </view>
          </view>
          <text class="comment-empty" v-else>暂无评论，快来抢沙发~</text>
        </view>

        <view class="comment-editor">
          <input
            v-model="commentForm"
            class="comment-input"
            placeholder="说点什么吧..."
            maxlength="200"
          />
          <button class="comment-btn" @tap="handleSubmitComment">发布</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import QRCode from 'qrcode'
import {
  getActivityDetail,
  enterActivity,
  getMyEnterActivity,
  cancelActivityByActivity,
  getSignCode,
  signIn,
  getMySignIn,
  downloadAttachment,
  getFavoriteList,
  favoriteActivity,
  cancelFavoriteActivity,
  getCommentList,
  addCommentActivity,
} from '@/services/activity'
import { useMemberStore } from '@/stores'

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
const memberStore = useMemberStore()
const isAdmin = computed(() => {
  const username = String(memberStore.profile?.username || '').toLowerCase()
  return username === 'admin'
})
const activityId = ref<any>('')
const favoriteRecord = ref<any>(null)
const myEnterRecord = ref<any>(null)
const mySignInRecord = ref<any>(null)
const isSignedIn = computed(() => mySignInRecord.value?.signInStatus === '已签到')

const commentForm = ref('')
const comments = ref<any[]>([])
const commentVisible = ref(false)

// QR code state for check-in
const qrVisible = ref(false)
const qrToken = ref('')
const qrDataUrl = ref('')
const qrError = ref('')

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
  activityId.value = options?.id || '1'
  fetchDetail(activityId.value)
})

const formatTimeRange = (start?: string, end?: string) => {
  if (!start && !end) return ''
  const s = start ? new Date(start) : null
  const e = end ? new Date(end) : null
  if (s && e) return `${s.toLocaleString('zh-CN')} - ${e.toLocaleString('zh-CN')}`
  if (s) return s.toLocaleString('zh-CN')
  return e ? e.toLocaleString('zh-CN') : ''
}

const getMimeType = (fileName: string) => {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

const getImageUrl = async (fileName?: string) => {
  if (!fileName) return ''
  try {
    const res = await downloadAttachment(fileName)
    const buffer = res?.data as ArrayBuffer
    if (!buffer) return ''
    const base64 = uni.arrayBufferToBase64(buffer)
    return `data:${getMimeType(fileName)};base64,${base64}`
  } catch {
    return ''
  }
}

const fetchComments = async () => {
  const res: any = await getCommentList({
    pageNum: 1,
    pageSize: 200,
    query: { activityId: activityId.value },
  })
  comments.value = (res?.data?.records || []).filter((item: any) => Number(item.delFlag) !== 1)
}

const openCommentPopup = async () => {
  commentVisible.value = true
  try {
    await fetchComments()
  } catch (err) {
    console.error('openCommentPopup error', err)
  }
}

const closeCommentPopup = () => {
  commentVisible.value = false
}

const fetchDetail = async (id: string | number) => {
  try {
    uni.showLoading({ title: '加载中...' })
    const [resMyEnter, resMySignIn, resFavorite, res]: any = await Promise.all([
      getMyEnterActivity(String(id)),
      getMySignIn(String(id)),
      getFavoriteList({
        pageNum: 1,
        pageSize: 1,
        query: { userId: memberStore.profile?.id, activityId: id, status: '已收藏' },
      }),
      getActivityDetail(String(id)),
    ])

    const d: any = res.data
    myEnterRecord.value = resMyEnter?.data || null
    mySignInRecord.value = resMySignIn?.data || null
    favoriteRecord.value = resFavorite?.data?.records?.[0] || null

    const coverFile = [d.image1, d.image2, d.image3, d.image4, d.image5].find((file: any) => !!file)
    const coverUrl = await getImageUrl(coverFile)

    activityData.value = {
      id: d.id,
      title: d.name || d.title || '活动详情',
      cover: coverUrl || '',
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
      isFavorited: !!favoriteRecord.value,
      isEnrolled: !!(myEnterRecord.value && myEnterRecord.value.status === '已报名'),
      needsCheckin: !!(d.registrationRuleId || d.ruleId || d.registrationRule),
    }

    await fetchComments()
  } catch (err) {
    console.error('fetchDetail error', err)
  } finally {
    uni.hideLoading()
  }
}

const closeQr = () => {
  qrVisible.value = false
  qrToken.value = ''
  qrDataUrl.value = ''
  qrError.value = ''
}

const generateQrDataUrl = async (text: string) => {
  try {
    qrDataUrl.value = await QRCode.toDataURL(text, { errorCorrectionLevel: 'M' as any })
  } catch (err) {
    console.error('generateQrDataUrl error', err)
    // 部分端（尤其小程序）可能不支持 toDataURL，降级使用在线二维码图片
    try {
      qrDataUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(
        text,
      )}`
      qrError.value = ''
    } catch {
      qrError.value = '二维码生成失败，请稍后重试'
    }
  }
}

const showQrCode = async (text: string) => {
  qrToken.value = text
  qrError.value = ''
  qrVisible.value = true
  await nextTick()
  await generateQrDataUrl(text)
}

// Action Handlers
const toggleFavorite = async () => {
  try {
    if (activityData.value.isFavorited) {
      if (!favoriteRecord.value?.id) {
        const refreshRes: any = await getFavoriteList({
          pageNum: 1,
          pageSize: 1,
          query: {
            userId: memberStore.profile?.id,
            activityId: activityData.value.id,
            status: '已收藏',
          },
        })
        favoriteRecord.value = refreshRes?.data?.records?.[0] || null
      }
      if (!favoriteRecord.value?.id) throw new Error('未找到收藏记录')
      await cancelFavoriteActivity(String(favoriteRecord.value.id))
      activityData.value.isFavorited = false
      favoriteRecord.value = null
      uni.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      await favoriteActivity(String(activityData.value.id))
      const refreshRes: any = await getFavoriteList({
        pageNum: 1,
        pageSize: 1,
        query: {
          userId: memberStore.profile?.id,
          activityId: activityData.value.id,
          status: '已收藏',
        },
      })
      favoriteRecord.value = refreshRes?.data?.records?.[0] || null
      activityData.value.isFavorited = true
      uni.showToast({ title: '已加入收藏', icon: 'success' })
    }
  } catch (err) {
    console.error('toggleFavorite error', err)
  }
}

const handleCheckin = async () => {
  if (!activityData.value.isEnrolled) {
    uni.showToast({ title: '请先报名活动后再签到', icon: 'none' })
    return
  }

  try {
    uni.showLoading({ title: '生成签到二维码...' })

    // 直接向后端取签到 token（后端已做规则校验）
    const codeRes: any = await getSignCode(String(activityData.value.id))
    const codeData: any = codeRes?.data

    if (codeData && typeof codeData === 'string') {
      await showQrCode(codeData)
    } else {
      uni.showToast({ title: '未能获取签到信息', icon: 'none' })
    }
  } catch (err: any) {
    console.error('checkin error', err)
    uni.showToast({ title: err?.data?.message || '获取签到失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const handleScanVerify = async () => {
  try {
    const scanRes: any = await new Promise((resolve, reject) => {
      uni.scanCode({
        onlyFromCamera: true,
        scanType: ['qrCode'],
        success: resolve,
        fail: reject,
      })
    })

    const signCode = String(scanRes?.result || '').trim()
    if (!signCode) {
      uni.showToast({ title: '未识别到二维码内容', icon: 'none' })
      return
    }

    uni.showLoading({ title: '核验中...' })
    await signIn(String(activityData.value.id), signCode)
    uni.showModal({
      title: '核验成功',
      content: '该用户签到核验通过',
      showCancel: false,
      confirmText: '知道了',
    })
  } catch (err: any) {
    const message = String(err?.data?.message || err?.message || err?.errMsg || '扫码核验失败')
    if (!message.includes('cancel')) {
      uni.showModal({
        title: message.includes('已签到') ? '已签到' : '核验失败',
        content: message.includes('已签到') ? '该用户已签到，请勿重复核验' : message,
        showCancel: false,
        confirmText: '知道了',
      })
    }
    console.error('scan verify error', err)
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
          const myRes: any = await getMyEnterActivity(String(activityData.value.id))
          myEnterRecord.value = myRes?.data || null
          activityData.value.isEnrolled = !!(
            myEnterRecord.value && myEnterRecord.value.status === '已报名'
          )
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
    content: '确定取消本活动报名吗？',
    confirmColor: '#FF4D4F',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中' })
          await cancelActivityByActivity(String(activityData.value.id))
          myEnterRecord.value = null
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

const handleSubmitComment = async () => {
  const content = commentForm.value.trim()
  if (!content) {
    uni.showToast({ title: '评论内容不能为空', icon: 'none' })
    return
  }
  try {
    uni.showLoading({ title: '发布中...' })
    await addCommentActivity({
      activityId: activityData.value.id,
      content,
      level: 5,
    })
    commentForm.value = ''
    await fetchComments()
    uni.showToast({ title: '评论成功', icon: 'success' })
  } catch (err) {
    console.error('comment error', err)
  } finally {
    uni.hideLoading()
  }
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

      &.signed {
        background: #f5f7fa;
        color: #27ba9b;
        border: 2rpx solid #27ba9b;
        box-shadow: none;
      }

      &:active {
        transform: scale(0.96);
      }
    }
  }
}

/* Comment Popup */
.comment-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 210;
  display: flex;
  align-items: flex-end;
}

.comment-popup {
  width: 100%;
  max-height: 80vh;
  background: #fff;
  border-radius: 28rpx 28rpx 0 0;
  padding: 24rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.comment-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;

  .comment-popup-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }

  .comment-popup-close {
    font-size: 44rpx;
    color: #999;
    line-height: 1;
    padding: 4rpx 8rpx;
  }
}

.comment-popup-body {
  flex: 1;
  overflow-y: auto;
  min-height: 200rpx;
}

.comment-editor {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 16rpx;

  .comment-input {
    flex: 1;
    height: 76rpx;
    background: #f5f7fa;
    border-radius: 12rpx;
    padding: 0 20rpx;
    font-size: 26rpx;
  }

  .comment-btn {
    width: 140rpx;
    height: 76rpx;
    line-height: 76rpx;
    border-radius: 12rpx;
    font-size: 26rpx;
    color: #fff;
    background: #667eea;
    margin: 0;
  }
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;

  .comment-item {
    padding: 16rpx;
    border-radius: 12rpx;
    background: #f8f9fb;

    .comment-user {
      display: block;
      font-size: 24rpx;
      color: #333;
      font-weight: bold;
      margin-bottom: 8rpx;
    }

    .comment-content {
      display: block;
      font-size: 26rpx;
      color: #555;
      margin-bottom: 8rpx;
      white-space: pre-wrap;
    }

    .comment-time {
      display: block;
      font-size: 22rpx;
      color: #999;
    }
  }
}

.comment-empty {
  font-size: 24rpx;
  color: #999;
  padding: 20rpx 0;
}

/* QR Code modal */
.qr-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.qr-dialog {
  width: 720rpx;
  max-width: 90vw;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.qr-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.qr-image {
  width: 420rpx;
  height: 420rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.08);
  object-fit: contain;
}

.qr-text {
  font-size: 24rpx;
  color: #666;
  word-break: break-all;
  text-align: center;
  max-height: 100rpx;
  overflow: hidden;
}

.qr-error {
  font-size: 24rpx;
  color: #ff4d4f;
  text-align: center;
}

.qr-actions {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

.qr-close {
  padding: 0 32rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 36rpx;
  background: #1f8ef1;
  color: #fff;
  font-size: 26rpx;
  font-weight: bold;
}
</style>
