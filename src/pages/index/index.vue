<template>
  <view class="home-page">
    <!-- Header Area -->
    <view class="header">
      <view class="greeting">
        <text class="title">Campus活动</text>
        <text class="subtitle">Hi, {{ displayName }} 👋 发现精彩校园生活</text>
      </view>
      <view class="search-bar">
        <text class="icon-search">🔍</text>
        <input
          class="search-input"
          type="text"
          placeholder="搜索你感兴趣的活动..."
          disabled
          @tap="handleSearch"
        />
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

      <view class="activity-list">
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
                <text class="meta-text"
                  >{{ activity.joined }}/{{ activity.capacity }} 人已报名</text
                >
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

const memberStore = useMemberStore()
const displayName = computed(
  () => memberStore.profile?.nickname || memberStore.profile?.phone || '同学',
)

// Ensure user is logged in
onShow(() => {
  if (!memberStore.profile?.token) {
    uni.reLaunch({ url: '/pages/login/login' })
  }
})

// --- Mock Data ---

const banners = ref([
  {
    id: 1,
    title: '2026届校园十佳歌手总决赛',
    image:
      'https://images.unsplash.com/photo-1540039155732-d68f76e0339d?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 2,
    title: '春季校园定向越野公开赛',
    image:
      'https://images.unsplash.com/photo-1552674605-15f37018a7a0?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'AI人工智能创新应用讲座',
    image:
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600&auto=format&fit=crop',
  },
])

const categories = ref([
  {
    id: 1,
    name: '学术讲座',
    icon: '📚',
    color: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
  },
  {
    id: 2,
    name: '体育竞技',
    icon: '🏃‍♂️',
    color: 'linear-gradient(135deg, #84FAB0 0%, #8FD3F4 100%)',
  },
  {
    id: 3,
    name: '文艺演出',
    icon: '🎭',
    color: 'linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%)',
  },
  {
    id: 4,
    name: '志愿服务',
    icon: '🤝',
    color: 'linear-gradient(135deg, #FCCB90 0%, #D57EEB 100%)',
  },
])

const activities = ref([
  {
    id: 101,
    title: '“青春律动” 校园街舞争霸赛',
    cover:
      'https://images.unsplash.com/photo-1518834107812-6aed9cecdbb4?q=80&w=400&auto=format&fit=crop',
    status: '报名中',
    statusType: 'active',
    time: '本周五 18:30 - 21:00',
    location: '大学生活动中心',
    joined: 120,
    capacity: 200,
    tags: ['音乐小镇', '官方认证'],
    isFavorited: true,
  },
  {
    id: 102,
    title: '名企学长学姐带你进大厂分享会',
    cover:
      'https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=400&auto=format&fit=crop',
    status: '即将开始',
    statusType: 'warning',
    time: '明天 14:00 - 16:30',
    location: '图书馆第一学术报告厅',
    joined: 280,
    capacity: 300,
    tags: ['讲座', '求职就业'],
    isFavorited: false,
  },
  {
    id: 103,
    title: '环保社：周末净滩志愿公益行',
    cover:
      'https://images.unsplash.com/photo-1618477461853-cf6ed80fca18?q=80&w=400&auto=format&fit=crop',
    status: '已满员',
    statusType: 'disabled',
    time: '本周日 08:00 - 12:00',
    location: '南门滨海湾公园',
    joined: 50,
    capacity: 50,
    tags: ['公益', '户外'],
    isFavorited: false,
  },
])

// --- Methods ---

const handleSearch = () => {
  uni.showToast({ title: '搜索功能开发中', icon: 'none' })
}

const handleCategory = (name: string) => {
  uni.showToast({ title: `点击分类：${name}`, icon: 'none' })
}

const handleViewAll = () => {
  uni.showToast({ title: '查看全部活动', icon: 'none' })
}

const handleViewDetail = (activity: any) => {
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
  margin-bottom: -60rpx; /* Pulled up to let banner overlap */

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

    .icon-search {
      font-size: 32rpx;
      margin-right: 16rpx;
    }

    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: #fff;
      &::placeholder {
        color: rgba(255, 255, 255, 0.7);
      }
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
    transform: translateY(0); /* For overlap context */
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
            background: rgba(39, 186, 155, 0.85); /* Green */
          }
          &.warning {
            background: rgba(250, 173, 20, 0.85); /* Orange */
          }
          &.disabled {
            background: rgba(153, 153, 153, 0.85); /* Gray */
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
