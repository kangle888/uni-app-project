<template>
  <view class="activity-page">
    <!-- Header with Search -->
    <view class="header-section">
      <view class="search-box">
        <text class="search-icon">🔍</text>
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
      <view class="activity-list" v-if="filteredActivities.length > 0">
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

const searchKeyword = ref('')
const currentCategory = ref('all')

const categories = ref([
  { id: 'all', name: '全部' },
  { id: 'lecture', name: '学术讲座' },
  { id: 'sports', name: '体育竞技' },
  { id: 'arts', name: '文艺演出' },
  { id: 'volunteer', name: '志愿服务' },
  { id: 'club', name: '社团活动' },
])

const allActivities = ref([
  {
    id: 1,
    categoryId: 'arts',
    title: '“青春律动” 校园街舞争霸赛决赛',
    cover:
      'https://images.unsplash.com/photo-1518834107812-6aed9cecdbb4?q=80&w=400&auto=format&fit=crop',
    status: '报名中',
    statusType: 'active',
    time: '本周五 18:30 - 21:00',
    location: '大学生活动中心',
    joined: 120,
    capacity: 200,
    isFavorited: true,
  },
  {
    id: 2,
    categoryId: 'lecture',
    title: '名企学长学姐带你进大厂分享会',
    cover:
      'https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=400&auto=format&fit=crop',
    status: '即将开始',
    statusType: 'warning',
    time: '明天 14:00 - 16:30',
    location: '图书馆第一学术报告厅',
    joined: 280,
    capacity: 300,
    isFavorited: false,
  },
  {
    id: 3,
    categoryId: 'volunteer',
    title: '环保社：周末净滩志愿公益行',
    cover:
      'https://images.unsplash.com/photo-1618477461853-cf6ed80fca18?q=80&w=400&auto=format&fit=crop',
    status: '已满员',
    statusType: 'disabled',
    time: '本周日 08:00 - 12:00',
    location: '南门滨海湾公园',
    joined: 50,
    capacity: 50,
    isFavorited: false,
  },
  {
    id: 4,
    categoryId: 'sports',
    title: '第九届“新生杯”篮球对抗赛',
    cover:
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=400&auto=format&fit=crop',
    status: '进行中',
    statusType: 'active',
    time: '每天 16:00 - 18:00',
    location: '北区露天篮球场',
    joined: 32,
    capacity: 40,
    isFavorited: false,
  },
  {
    id: 5,
    categoryId: 'club',
    title: '摄影协会：校园秋景外拍采风',
    cover:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400&auto=format&fit=crop',
    status: '报名中',
    statusType: 'active',
    time: '下周四 14:00 - 17:00',
    location: '主校区银杏大道',
    joined: 15,
    capacity: 25,
    isFavorited: true,
  },
  {
    id: 6,
    categoryId: 'lecture',
    title: '人工智能前沿应用与ChatGPT讲座',
    cover:
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=400&auto=format&fit=crop',
    status: '已结束',
    statusType: 'disabled',
    time: '上周五 19:00 - 21:00',
    location: '科技楼阶梯教室',
    joined: 150,
    capacity: 150,
    isFavorited: false,
  },
])

// Filter activities based on Category & Search Keyword
const filteredActivities = computed(() => {
  let result = allActivities.value

  // 1. Filter by category
  if (currentCategory.value !== 'all') {
    result = result.filter((item) => item.categoryId === currentCategory.value)
  }

  // 2. Filter by search keyword
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

const handleSearch = () => {
  // Logic triggers automatically through computed property, but you could trigger API fetches here
  if (searchKeyword.value) {
    uni.showToast({ title: `搜索: ${searchKeyword.value}`, icon: 'none' })
  }
}

const goDetail = (activity: any) => {
  uni.navigateTo({ url: `/pages/activity-detail/activity-detail?id=${activity.id}` })
}

const toggleFavorite = (activity: any) => {
  activity.isFavorited = !activity.isFavorited
  uni.showToast({
    title: activity.isFavorited ? '已收藏' : '已取消收藏',
    icon: 'success',
    duration: 1000,
  })
}

const handleCreateRequest = () => {
  uni.showToast({ title: '发起活动功能开发中~', icon: 'none' })
}
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
