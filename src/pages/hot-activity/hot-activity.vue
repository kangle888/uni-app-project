<template>
  <view class="hot-page">
    <view class="header-card">
      <text class="title">热门活动</text>
      <text class="subtitle">发现更多正在进行的校园活动</text>
    </view>

    <view class="search-wrap">
      <input
        class="search-input"
        v-model="searchKeyword"
        placeholder="搜索活动名称"
        confirm-type="search"
        @confirm="handleSearch"
      />
      <text v-if="searchKeyword" class="clear-btn" @tap="clearSearch">×</text>
    </view>

    <view v-if="isLoading" class="loading-wrap">
      <text class="loading-text">活动加载中...</text>
    </view>

    <view v-else-if="activities.length" class="list-wrap">
      <view class="card" v-for="item in activities" :key="item.id" @tap="goDetail(item.id)">
        <image class="cover" :src="item.cover" mode="aspectFill" />
        <view class="info">
          <text class="name">{{ item.name }}</text>
          <text class="meta">{{ item.timeText }}</text>
          <text class="meta">{{ item.address || '地点待定' }}</text>
          <text class="meta">{{ item.hot }}/{{ item.number }} 人已报名</text>
        </view>
      </view>
    </view>

    <view v-else class="empty-wrap">
      <text class="empty-text">暂无热门活动</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getActivityPage, downloadAttachment } from '@/services/activity'

const searchKeyword = ref('')
const isLoading = ref(false)
const activities = ref<any[]>([])

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

const loadData = async () => {
  isLoading.value = true
  try {
    const res: any = await getActivityPage({
      pageNum: 1,
      pageSize: 100,
      query: {
        isTop: '1',
        name: searchKeyword.value.trim() || undefined,
      },
    })
    const rows = res?.data?.records || res?.data?.rows || []
    activities.value = await Promise.all(
      rows.map(async (item: any) => {
        const fileName = item?.image1 || item?.image || item?.cover
        const cover = (await getImageUrl(fileName)) || fileName || ''
        return {
          ...item,
          cover,
          timeText: `${formatDateTime(item?.startTime)} - ${formatDateTime(item?.endTime)}`,
        }
      }),
    )
  } catch (err) {
    console.error('load hot activities error', err)
    activities.value = []
  } finally {
    isLoading.value = false
  }
}

const handleSearch = async () => {
  await loadData()
}

const clearSearch = async () => {
  searchKeyword.value = ''
  await loadData()
}

const goDetail = (id: string | number) => {
  uni.navigateTo({ url: `/pages/activity-detail/activity-detail?id=${id}` })
}

onLoad(() => {
  loadData()
})

onShow(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.hot-page {
  min-height: 100vh;
  background: #f7f9fc;
  padding: 24rpx;
}

.header-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;

  .title {
    display: block;
    font-size: 36rpx;
    color: #fff;
    font-weight: bold;
  }

  .subtitle {
    display: block;
    margin-top: 8rpx;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.85);
  }
}

.search-wrap {
  height: 76rpx;
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 40rpx;
  padding: 0 24rpx;
  margin-bottom: 20rpx;

  .search-input {
    flex: 1;
    font-size: 28rpx;
    color: #333;
  }

  .clear-btn {
    font-size: 32rpx;
    color: #999;
    padding: 0 10rpx;
  }
}

.loading-wrap,
.empty-wrap {
  text-align: center;
  padding: 80rpx 0;

  .loading-text,
  .empty-text {
    font-size: 26rpx;
    color: #999;
  }
}

.list-wrap {
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  .card {
    background: #fff;
    border-radius: 18rpx;
    padding: 18rpx;
    display: flex;
    gap: 16rpx;

    .cover {
      width: 220rpx;
      height: 160rpx;
      border-radius: 12rpx;
      background: #eee;
    }

    .info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8rpx;

      .name {
        font-size: 30rpx;
        color: #222;
        font-weight: 600;
      }

      .meta {
        font-size: 24rpx;
        color: #666;
      }
    }
  }
}
</style>
