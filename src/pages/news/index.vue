<template>
  <view class="page">
    <view class="top-bar">
      <view class="title">上新推文</view>
    </view>

    <view class="list">
      <view v-for="item in items" :key="item" class="cell">
        <view class="icon">✉</view>
        <view class="text">{{ item }}</view>
        <view class="arrow">›</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const items = [
  '随心飞4月16航班调整，含文档和工具',
  '国庆，10块钱直飞往返槟城，含行李？',
  '本月抢什么？',
  '小程序介绍及使用教程',
]
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #eceff5;
}

.top-bar {
  height: 176rpx;
  background: #f51c17;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding-bottom: 22rpx;
}

.title {
  color: #fff;
  font-size: 42rpx;
  font-weight: 700;
}

.list {
  padding: 22rpx 18rpx;
}

.cell {
  height: 98rpx;
  background: #fff;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  margin-bottom: 16rpx;
}

.icon {
  color: #d63834;
  font-size: 36rpx;
  margin-right: 14rpx;
}

.text {
  flex: 1;
  font-size: 36rpx;
  color: #262626;
}

.arrow {
  color: #9c9c9c;
  font-size: 42rpx;
}
</style>
