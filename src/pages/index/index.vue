<template>
  <view class="home-page">
    <!-- Header Area -->
    <view class="header">
      <view class="greeting">
        <text class="title">Campus活动</text>
        <text class="subtitle">Hi, {{ displayName }} 👋 发现精彩校园生活</text>
      </view>
      <view class="search-bar">
        <text class="icon-search" @tap="handleSearch"></text>
        <input
          class="search-input"
          type="text"
          v-model="searchKeyword"
          placeholder="搜索你感兴趣的活动..."
          confirm-type="search"
          @confirm="handleSearch"
        />
        <text class="clear-icon" v-if="searchKeyword" @tap="clearSearch">✖</text>
      </view>
    </view>

    <!-- Carousel Banners -->
    <view class="banner-section">
      <swiper
        class="swiper"
        circular
        autoplay
        :interval="3000"
        :duration="500"
        indicator-dots
        indicator-active-color="#ffffff"
        indicator-color="rgba(255, 255, 255, 0.4)"
      >
        <swiper-item v-for="(item, index) in banners" :key="index">
          <view class="swiper-item">
            <image :src="item.image" mode="aspectFill" class="banner-image"></image>
            <view class="banner-text">
              <text class="banner-title">{{ item.title }}</text>
            </view>
          </view>
        </swiper-item>
      </swiper>
    </view>

    <!-- Quick Navigation Grid -->
    <view class="quick-nav">
      <view
        class="nav-item"
        v-for="item in categories"
        :key="item.id"
        @tap="handleCategory(item.name)"
      >
        <view class="icon-box" :style="{ background: item.color }">
          <text class="icon-text">{{ item.icon }}</text>
        </view>
        <text class="nav-name">{{ item.name }}</text>
      </view>
    </view>

    <!-- Hot Activities List -->
    <view class="activities-section">
      <view class="section-header">
        <text class="section-title">热门活动 🔥</text>
        <text class="view-all" @tap="handleViewAll">查看全部 ></text>
      </view>

      <view v-if="isLoading" class="loading-wrap">
        <text class="loading-text">活动加载中...</text>
      </view>

      <view class="activity-list" v-else>
        <view
          class="activity-card"
          v-for="activity in activities"
          :key="activity.id"
          @tap="handleViewDetail(activity)"
        >
          <!-- Cover -->
          <view class="cover-wrapper">
            <image :src="activity.cover" mode="aspectFill" class="cover-image"></image>
            <view class="status-badge" :class="activity.statusType">{{ activity.status }}</view>
          </view>

          <!-- Info -->
          <view class="info-wrapper">
            <text class="activity-title">{{ activity.title }}</text>
            <view class="activity-meta">
              <view class="meta-item">
                <text class="meta-icon">🕒</text>
                <text class="meta-text">{{ activity.time }}</text>
              </view>
              <view class="meta-item">
                <text class="meta-icon">📍</text>
                <text class="meta-text">{{ activity.location }}</text>
              </view>
              <view class="meta-item">
                <text class="meta-icon">👤</text>
                <text class="meta-text">{{ activity.hot }}/{{ activity.capacity }} 人已报名</text>
              </view>
            </view>

            <!-- Tags & Actions -->
            <view class="card-footer">
              <view class="tags">
                <text class="tag" v-for="(tag, index) in activity.tags" :key="index">{{
                  tag
                }}</text>
              </view>
              <view class="actions">
                <view class="action-btn fav-btn" @tap.stop="toggleFavorite(activity)">
                  <text class="action-icon">{{ activity.isFavorited ? '❤️' : '🤍' }}</text>
                </view>
                <view class="action-btn primary-btn" @tap.stop="handleViewDetail(activity)">
                  <text>详情</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="load-more">
        <text>已经到底啦 ~</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMemberStore } from '@/stores'
import { onShow } from '@dcloudio/uni-app'
import {
  downloadAttachment,
  getActivityPage,
  getBannerImgs,
  getFavoriteList,
  favoriteActivity,
  cancelFavoriteActivity,
} from '@/services/activity'

interface BannerItem {
  id: string | number
  title: string
  image: string
}

interface ActivityCard {
  id: string | number
  favoriteId?: string
  title: string
  cover: string
  status: string
  statusType: 'active' | 'warning' | 'disabled'
  time: string
  location: string
  hot: number
  capacity: number
  tags: string[]
  isFavorited: boolean
}

const memberStore = useMemberStore()
const displayName = computed(
  () => memberStore.profile?.nickname || memberStore.profile?.phone || '同学',
)

const searchKeyword = ref('')
const currentType = ref('')
const isLoading = ref(false)

const banners = ref<BannerItem[]>([])
const categories = ref([
  {
    id: 1,
    name: '学术讲座',
    type: '学术讲座',
    icon: '📚',
    color: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
  },
  {
    id: 2,
    name: '体育竞技',
    type: '体育竞技',
    icon: '🏃‍♂️',
    color: 'linear-gradient(135deg, #84FAB0 0%, #8FD3F4 100%)',
  },
  {
    id: 3,
    name: '文艺演出',
    type: '文艺演出',
    icon: '🎭',
    color: 'linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%)',
  },
  {
    id: 4,
    name: '志愿服务',
    type: '志愿服务',
    icon: '🤝',
    color: 'linear-gradient(135deg, #FCCB90 0%, #D57EEB 100%)',
  },
  {
    id: 5,
    name: '社团活动',
    type: '社团活动',
    icon: '🎯',
    color: 'linear-gradient(135deg, #89F7FE 0%, #66A6FF 100%)',
  },
])
const activities = ref<ActivityCard[]>([])

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

const formatDateTime = (value?: string) => {
  if (!value) return '时间待定'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

const getStatusInfo = (status?: string) => {
  if (!status) return { text: '进行中', type: 'active' as const }
  if (status.includes('结束') || status.includes('关闭')) {
    return { text: '已结束', type: 'disabled' as const }
  }
  if (status.includes('即将')) {
    return { text: '即将开始', type: 'warning' as const }
  }
  if (status.includes('满')) {
    return { text: '已满员', type: 'disabled' as const }
  }
  return { text: '报名中', type: 'active' as const }
}

const loadBanners = async () => {
  try {
    const res = await getBannerImgs()
    const list = Array.isArray(res?.data) ? res.data : []
    const mapped = await Promise.all(
      list.map(async (item: any, index: number) => {
        const fileName = typeof item === 'string' ? item : item?.fileName || item?.image || ''
        const imageUrl = await getImageUrl(fileName)
        console.log('imageUrl', imageUrl)
        return {
          id: item?.id || index,
          title: item?.title || item?.name || '校园活动推荐',
          image: imageUrl,
        }
      }),
    )
    banners.value = mapped.filter((item) => !!item.image)
  } catch {
    banners.value = []
  }
}

const loadActivities = async (options?: { pageSize?: number; isTop?: string }) => {
  isLoading.value = true
  try {
    const [res, favoriteRes]: any = await Promise.all([
      getActivityPage({
        pageNum: 1,
        pageSize: options?.pageSize ?? 3,
        query: {
          isTop: options?.isTop ?? '1',
          type: currentType.value || undefined,
          name: searchKeyword.value.trim() || undefined,
        },
      }),
      getFavoriteList({
        pageNum: 1,
        pageSize: 2000,
        query: { userId: memberStore.profile?.id, status: '已收藏' },
      }),
    ])

    const favoriteRecords = favoriteRes?.data?.records || []
    const favoriteMap = new Map<string, any>()
    favoriteRecords.forEach((item: any) => {
      favoriteMap.set(String(item.activityId), item)
    })

    const pageData = res?.data as any
    const rows = pageData?.rows || pageData?.records || pageData?.list || []

    const mapped = await Promise.all(
      rows.map(async (item: any) => {
        const fileName = item?.image1 || item?.image || item?.cover
        const coverUrl = await getImageUrl(fileName)
        const statusInfo = getStatusInfo(item?.status)
        const favorite = favoriteMap.get(String(item?.id))

        return {
          id: item?.id,
          favoriteId: favorite?.id || '',
          title: item?.name || '未命名活动',
          cover: coverUrl || fileName || '',
          status: statusInfo.text,
          statusType: statusInfo.type,
          time: `${formatDateTime(item?.startTime)} - ${formatDateTime(item?.endTime)}`,
          location: item?.address || '地点待定',
          hot: Number(item?.hot || 0),
          capacity: Number(item?.number || 0),
          tags: [item?.type || '校园活动'],
          isFavorited: !!favorite,
        } as ActivityCard
      }),
    )

    activities.value = mapped
  } catch {
    activities.value = []
  } finally {
    isLoading.value = false
  }
}

onShow(async () => {
  if (!memberStore.profile?.token) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }

  await Promise.all([loadBanners(), loadActivities({ pageSize: 3, isTop: '1' })])
})

const handleSearch = async () => {
  await loadActivities({ pageSize: 3, isTop: '1' })
}

const clearSearch = async () => {
  searchKeyword.value = ''
  await loadActivities({ pageSize: 3, isTop: '1' })
}

const handleCategory = async (name: string) => {
  const category = categories.value.find((item) => item.name === name)
  currentType.value = category?.type || ''
  await loadActivities({ pageSize: 3, isTop: '1' })
}

const handleViewAll = () => {
  uni.navigateTo({ url: '/pages/hot-activity/hot-activity' })
}

const handleViewDetail = (activity: ActivityCard) => {
  uni.navigateTo({ url: `/pages/activity-detail/activity-detail?id=${activity.id}` })
}

const toggleFavorite = async (activity: ActivityCard) => {
  try {
    if (activity.isFavorited) {
      if (!activity.favoriteId) {
        const refreshRes: any = await getFavoriteList({
          pageNum: 1,
          pageSize: 1,
          query: {
            userId: memberStore.profile?.id,
            activityId: activity.id,
            status: '已收藏',
          },
        })
        activity.favoriteId = refreshRes?.data?.records?.[0]?.id || ''
      }

      if (!activity.favoriteId) {
        uni.showToast({ title: '未找到收藏记录', icon: 'none' })
        return
      }

      await cancelFavoriteActivity(String(activity.favoriteId))
      activity.isFavorited = false
      activity.favoriteId = ''
      uni.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      await favoriteActivity(String(activity.id))
      activity.isFavorited = true

      const refreshRes: any = await getFavoriteList({
        pageNum: 1,
        pageSize: 1,
        query: {
          userId: memberStore.profile?.id,
          activityId: activity.id,
          status: '已收藏',
        },
      })
      activity.favoriteId = refreshRes?.data?.records?.[0]?.id || ''
      uni.showToast({ title: '已收藏', icon: 'success' })
    }
  } catch (err) {
    console.error('toggleFavorite error', err)
  }
}
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background-color: #f7f9fc;
  padding-bottom: 40rpx;
}

/* Header Area */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 100rpx 40rpx 40rpx;
  border-bottom-left-radius: 40rpx;
  border-bottom-right-radius: 40rpx;
  color: #fff;
  margin-bottom: -60rpx;
  /* Pulled up to let banner overlap */

  .greeting {
    margin-bottom: 30rpx;

    .title {
      display: block;
      font-size: 48rpx;
      font-weight: bold;
      margin-bottom: 10rpx;
    }

    .subtitle {
      display: block;
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .search-bar {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border-radius: 40rpx;
    padding: 0 30rpx;
    height: 80rpx;
    border: 1px solid rgba(255, 255, 255, 0.3);
    margin-bottom: 16rpx;

    .icon-search {
      font-size: 32rpx;
      margin-right: 16rpx;
      color: #fff;
    }

    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: #fff;

      &::placeholder {
        color: rgba(255, 255, 255, 0.7);
      }
    }

    .clear-icon {
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.8);
      padding: 8rpx 12rpx;
    }
  }
}

/* Banner Section */
.banner-section {
  padding: 0 30rpx;
  margin-top: 20rpx;

  .swiper {
    height: 300rpx;
    border-radius: 20rpx;
    overflow: hidden;
    transform: translateY(0);
    /* For overlap context */
    box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.15);

    .swiper-item {
      width: 100%;
      height: 100%;
      position: relative;

      .banner-image {
        width: 100%;
        height: 100%;
        background-color: #eee;
      }

      .banner-text {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 40rpx 30rpx 20rpx;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%);

        .banner-title {
          color: #fff;
          font-size: 32rpx;
          font-weight: bold;
          text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
        }
      }
    }
  }
}

/* Quick Navigation */
.quick-nav {
  display: flex;
  justify-content: space-around;
  padding: 50rpx 20rpx 30rpx;
  background: #fff;
  margin: 30rpx 30rpx 0;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .icon-box {
      width: 96rpx;
      height: 96rpx;
      border-radius: 32rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 16rpx;
      box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;

      &:active {
        transform: scale(0.9);
      }

      .icon-text {
        font-size: 48rpx;
      }
    }

    .nav-name {
      font-size: 26rpx;
      color: #333;
      font-weight: 500;
    }
  }
}

/* Activities List */
.loading-wrap {
  padding: 60rpx 0;
  text-align: center;

  .loading-text {
    font-size: 26rpx;
    color: #999;
  }
}

.activities-section {
  padding: 40rpx 30rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 30rpx;

    .section-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #222;
    }

    .view-all {
      font-size: 26rpx;
      color: #999;
    }
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 30rpx;

    .activity-card {
      background: #fff;
      border-radius: 24rpx;
      overflow: hidden;
      box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
      transition: transform 0.2s;

      &:active {
        transform: scale(0.98);
      }

      .cover-wrapper {
        position: relative;
        height: 280rpx;
        width: 100%;

        .cover-image {
          width: 100%;
          height: 100%;
          background-color: #f0f0f0;
        }

        .status-badge {
          position: absolute;
          top: 20rpx;
          right: 20rpx;
          padding: 6rpx 20rpx;
          border-radius: 30rpx;
          font-size: 24rpx;
          font-weight: bold;
          color: #fff;
          backdrop-filter: blur(4px);

          &.active {
            background: rgba(39, 186, 155, 0.85);
            /* Green */
          }

          &.warning {
            background: rgba(250, 173, 20, 0.85);
            /* Orange */
          }

          &.disabled {
            background: rgba(153, 153, 153, 0.85);
            /* Gray */
          }
        }
      }

      .info-wrapper {
        padding: 24rpx;

        .activity-title {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 20rpx;
          display: block;
          line-height: 1.4;
        }

        .activity-meta {
          display: flex;
          flex-direction: column;
          gap: 12rpx;
          margin-bottom: 24rpx;

          .meta-item {
            display: flex;
            align-items: center;

            .meta-icon {
              font-size: 24rpx;
              margin-right: 12rpx;
            }

            .meta-text {
              font-size: 26rpx;
              color: #666;
            }
          }
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20rpx;
          border-top: 1rpx dashed #eee;

          .tags {
            display: flex;
            gap: 12rpx;
            flex-wrap: wrap;

            .tag {
              font-size: 22rpx;
              color: #667eea;
              background: rgba(102, 126, 234, 0.1);
              padding: 4rpx 16rpx;
              border-radius: 8rpx;
            }
          }

          .actions {
            display: flex;
            gap: 16rpx;

            .action-btn {
              padding: 10rpx 24rpx;
              border-radius: 30rpx;
              display: flex;
              align-items: center;
              justify-content: center;

              &.fav-btn {
                background: #f5f7fa;
                padding: 10rpx 20rpx;
              }

              &.primary-btn {
                background: linear-gradient(to right, #667eea, #764ba2);
                color: #fff;
                font-size: 26rpx;
                font-weight: bold;
              }

              &:active {
                opacity: 0.8;
              }
            }
          }
        }
      }
    }
  }

  .load-more {
    text-align: center;
    padding: 40rpx 0;

    text {
      font-size: 24rpx;
      color: #ccc;
    }
  }
}
</style>
