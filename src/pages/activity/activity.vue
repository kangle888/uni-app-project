<template>
  <view class="activity-page">
    <!-- Header with Search -->
    <view class="header-section">
      <view class="search-box">
        <text class="search-icon"></text>
        <input
          class="search-input"
          type="text"
          v-model="searchKeyword"
          placeholder="搜索校内活动、讲座、比赛..."
          @confirm="handleSearch"
        />
        <text class="clear-icon" v-if="searchKeyword" @tap=";(searchKeyword = ''), handleSearch()"
          >✖</text
        >
      </view>
    </view>

    <!-- Categories Tabs (Scrollable) -->
    <scroll-view class="category-scroll" scroll-x :show-scrollbar="false">
      <view class="category-tabs">
        <view
          class="tab-item"
          v-for="cat in categories"
          :key="cat.id"
          :class="{ active: currentCategory === cat.id }"
          @tap="switchCategory(cat.id)"
        >
          <text class="tab-text">{{ cat.name }}</text>
          <view class="active-line" v-if="currentCategory === cat.id"></view>
        </view>
      </view>
    </scroll-view>

    <!-- Activity List -->
    <view class="activity-list-container">
      <view class="loading-wrap" v-if="isLoading">
        <text class="loading-text">活动加载中...</text>
      </view>

      <view class="activity-list" v-else-if="filteredActivities.length > 0">
        <view
          class="activity-card"
          v-for="activity in filteredActivities"
          :key="activity.id"
          @tap="goDetail(activity)"
        >
          <!-- Left Cover Image -->
          <view class="card-cover">
            <image :src="activity.cover" mode="aspectFill" class="cover-img"></image>
            <view class="status-badge" :class="activity.statusType">{{ activity.status }}</view>
          </view>

          <!-- Right Info -->
          <view class="card-info">
            <view class="title-row">
              <text class="title">{{ activity.title }}</text>
            </view>
            <view class="meta-row">
              <text class="meta-icon">🕒</text>
              <text class="meta-text">{{ activity.time }}</text>
            </view>
            <view class="meta-row">
              <text class="meta-icon">📍</text>
              <text class="meta-text">{{ activity.location }}</text>
            </view>
            <view class="bottom-row">
              <text class="participants">{{ activity.joined }}/{{ activity.capacity }}人已报</text>
              <view class="action-btn" @tap.stop="toggleFavorite(activity)">
                <text class="fav-icon">{{ activity.isFavorited ? '❤️' : '🤍' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Empty State -->
      <view class="empty-state" v-else>
        <view class="empty-icon">📭</view>
        <text class="empty-text">当前分类下暂时没有活动哦~</text>
        <button class="create-btn" @tap="handleCreateRequest">发起活动</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import {
  getActivityPage,
  getFavoriteList,
  favoriteActivity,
  cancelFavoriteActivity,
} from '@/services/activity'
import { useMemberStore } from '@/stores'

const memberStore = useMemberStore()
const searchKeyword = ref('')
const currentCategory = ref('all')

const categories = ref([
  { id: 'all', name: '全部' },
  { id: '学术讲座', name: '学术讲座' },
  { id: '体育竞技', name: '体育竞技' },
  { id: '文艺演出', name: '文艺演出' },
  { id: '志愿服务', name: '志愿服务' },
  { id: '社团活动', name: '社团活动' },
])

const allActivities = ref<any[]>([])
const isLoading = ref(false)
const showTopOnly = ref(false)

const defaultCover =
  'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=400&auto=format&fit=crop'

const formatTimeRange = (start?: string, end?: string) => {
  if (!start && !end) return ''
  const s = start ? new Date(start) : null
  const e = end ? new Date(end) : null
  if (s && e) return `${s.toLocaleString('zh-CN')} - ${e.toLocaleString('zh-CN')}`
  if (s) return s.toLocaleString('zh-CN')
  return e ? e.toLocaleString('zh-CN') : ''
}

const statusTypeFrom = (status?: string, hot?: number, number?: number) => {
  if (
    (status && String(status).includes('结束')) ||
    (Number(number) > 0 && Number(hot) >= Number(number))
  ) {
    return 'disabled'
  }
  if (status && (String(status).includes('即将') || String(status).includes('待启用'))) {
    return 'warning'
  }
  return 'active'
}

const loadActivities = async () => {
  isLoading.value = true
  try {
    const [pageRes, favoriteRes]: any = await Promise.all([
      getActivityPage({
        pageNum: 1,
        pageSize: 200,
        query: {
          isTop: showTopOnly.value ? '1' : undefined,
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

    const records = pageRes?.data?.records || []
    allActivities.value = records.map((d: any) => {
      const fav = favoriteMap.get(String(d.id))
      return {
        id: d.id,
        favoriteId: fav?.id || '',
        categoryId: d.type || '未分类',
        title: d.name || '未命名活动',
        cover: defaultCover,
        status: d.status || '未知状态',
        statusType: statusTypeFrom(d.status, d.hot, d.number),
        time: formatTimeRange(d.startTime, d.endTime),
        location: d.address || '未设置地点',
        joined: Number(d.hot) || 0,
        capacity: Number(d.number) || 0,
        isFavorited: !!fav,
      }
    })
  } catch (err) {
    allActivities.value = []
    console.error('loadActivities error', err)
  } finally {
    isLoading.value = false
  }
}

const filteredActivities = computed(() => {
  let result = allActivities.value

  if (currentCategory.value !== 'all') {
    result = result.filter((item) => item.categoryId === currentCategory.value)
  }

  if (searchKeyword.value.trim() !== '') {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(
      (item) => item.title.toLowerCase().includes(kw) || item.location.toLowerCase().includes(kw),
    )
  }

  return result
})

const switchCategory = (id: string) => {
  currentCategory.value = id
}

const handleSearch = () => {}

const goDetail = (activity: any) => {
  uni.navigateTo({ url: `/pages/activity-detail/activity-detail?id=${activity.id}` })
}

const toggleFavorite = async (activity: any) => {
  try {
    if (activity.isFavorited) {
      if (!activity.favoriteId) {
        const refreshRes: any = await getFavoriteList({
          pageNum: 1,
          pageSize: 1,
          query: { userId: memberStore.profile?.id, activityId: activity.id, status: '已收藏' },
        })
        activity.favoriteId = refreshRes?.data?.records?.[0]?.id || ''
      }
      if (!activity.favoriteId) throw new Error('未找到收藏记录')
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
        query: { userId: memberStore.profile?.id, activityId: activity.id, status: '已收藏' },
      })
      activity.favoriteId = refreshRes?.data?.records?.[0]?.id || ''
      uni.showToast({ title: '已收藏', icon: 'success' })
    }
  } catch (err) {
    console.error('toggle favorite error', err)
  }
}

const handleCreateRequest = () => {
  uni.showToast({ title: '发起活动功能开发中~', icon: 'none' })
}

onLoad((options) => {
  showTopOnly.value = String(options?.isTop || '') === '1'
})

onShow(() => {
  if (!memberStore.profile?.token) return
  loadActivities()
})
</script>

<style lang="scss" scoped>
.activity-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

/* Header & Search */
.header-section {
  background-color: #ffffff;
  padding: 20rpx 30rpx;
  position: sticky;
  top: 0;
  z-index: 100;

  .search-box {
    display: flex;
    align-items: center;
    background-color: #f0f2f5;
    height: 72rpx;
    border-radius: 36rpx;
    padding: 0 30rpx;

    .search-icon {
      font-size: 32rpx;
      color: #999;
      margin-right: 16rpx;
    }

    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: #333;
    }

    .clear-icon {
      font-size: 32rpx;
      color: #999;
      padding: 10rpx;
    }
  }
}

/* Categories Tabs */
.category-scroll {
  background-color: #ffffff;
  padding: 10rpx 0;
  border-bottom: 1rpx solid #eee;

  .category-tabs {
    display: flex;
    padding: 0 20rpx;
    white-space: nowrap;

    .tab-item {
      display: inline-block;
      padding: 16rpx 24rpx;
      position: relative;
      transition: all 0.3s;
      flex-shrink: 0;

      .tab-text {
        font-size: 30rpx;
        color: #666;
        transition: all 0.3s;
      }

      &.active {
        .tab-text {
          font-size: 32rpx;
          font-weight: bold;
          color: #667eea;
        }

        .active-line {
          position: absolute;
          bottom: 4rpx;
          left: 50%;
          transform: translateX(-50%);
          width: 40rpx;
          height: 6rpx;
          background-color: #667eea;
          border-radius: 6rpx;
        }
      }
    }
  }
}

/* Activity List */
.loading-wrap {
  padding: 80rpx 0;
  text-align: center;

  .loading-text {
    font-size: 26rpx;
    color: #999;
  }
}

.activity-list-container {
  flex: 1;
  padding: 30rpx;

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 30rpx;

    .activity-card {
      display: flex;
      background: #ffffff;
      border-radius: 20rpx;
      padding: 20rpx;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
      transition: transform 0.2s;

      &:active {
        transform: scale(0.98);
      }

      .card-cover {
        position: relative;
        width: 220rpx;
        height: 220rpx;
        flex-shrink: 0;
        border-radius: 12rpx;
        overflow: hidden;

        .cover-img {
          width: 100%;
          height: 100%;
          background-color: #eee;
        }

        .status-badge {
          position: absolute;
          top: 10rpx;
          left: 10rpx;
          padding: 4rpx 12rpx;
          border-radius: 8rpx;
          font-size: 20rpx;
          font-weight: bold;
          color: #fff;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4rpx);

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

      .card-info {
        flex: 1;
        margin-left: 20rpx;
        display: flex;
        flex-direction: column;

        .title-row {
          margin-bottom: 12rpx;

          .title {
            font-size: 30rpx;
            font-weight: bold;
            color: #333;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            overflow: hidden;
          }
        }

        .meta-row {
          display: flex;
          align-items: center;
          margin-bottom: 6rpx;

          .meta-icon {
            font-size: 24rpx;
            margin-right: 8rpx;
          }

          .meta-text {
            font-size: 24rpx;
            color: #666;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .bottom-row {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;

          .participants {
            font-size: 24rpx;
            color: #667eea;
            background: rgba(102, 126, 234, 0.08);
            padding: 4rpx 12rpx;
            border-radius: 8rpx;
          }

          .action-btn {
            width: 50rpx;
            height: 50rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f7fa;
            border-radius: 25rpx;
            transition: all 0.2s;

            &:active {
              transform: scale(0.9);
              background: #ebedf0;
            }

            .fav-icon {
              font-size: 28rpx;
            }
          }
        }
      }
    }
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 160rpx;

    .empty-icon {
      font-size: 120rpx;
      margin-bottom: 20rpx;
      filter: grayscale(1);
      opacity: 0.6;
    }

    .empty-text {
      font-size: 28rpx;
      color: #999;
      margin-bottom: 40rpx;
    }

    .create-btn {
      width: 280rpx;
      height: 80rpx;
      line-height: 80rpx;
      border-radius: 40rpx;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      font-size: 30rpx;
      border: none;
      box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.3);

      &:active {
        transform: scale(0.98);
        opacity: 0.9;
      }
    }
  }
}
</style>
