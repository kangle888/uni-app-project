<template>
  <view class="page">
    <view class="top-bar">
      <view class="title">关于</view>
    </view>

    <view class="profile-card">
      <view class="avatar"></view>
      <view class="meta">
        <view class="name">中转易-旅游信息差</view>
        <view class="sub">羊毛小能手</view>
        <view class="desc">好的旅游没有那么贵</view>
      </view>
      <view class="follow">+关注</view>
    </view>

    <view class="intro">
      开发者全称【中转易-旅游信息差】，小小红薯博主<br />
      兴趣于发掘与分享各种活动羊毛<br />
      主要范围于旅游，也涉及其它
    </view>

    <view class="list">
      <view v-for="item in items" :key="item" class="cell">
        <view class="left">{{ item }}</view>
        <view class="arrow">›</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const items = [
  '加入我们 / 微信群',
  '意见反馈 / 功能改进',
  '更新日志',
  '免责声明',
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

.profile-card {
  margin: 20rpx 20rpx 0;
  display: flex;
  align-items: center;
}

.avatar {
  width: 126rpx;
  height: 126rpx;
  border-radius: 50%;
  background: radial-gradient(
    circle at 40% 40%,
    #ffc3c3 0,
    #f18f8f 45%,
    #dc5a5a 100%
  );
}

.meta {
  margin-left: 16rpx;
  flex: 1;
}

.name {
  font-size: 40rpx;
  color: #252525;
  font-weight: 600;
}

.sub,
.desc {
  font-size: 32rpx;
  color: #7f7f7f;
  margin-top: 6rpx;
}

.follow {
  border: 2rpx solid #cc4f4b;
  color: #cc4f4b;
  padding: 8rpx 14rpx;
  border-radius: 10rpx;
  font-size: 30rpx;
}

.intro {
  margin: 20rpx;
  color: #9d9d9d;
  line-height: 1.8;
  font-size: 28rpx;
}

.list {
  padding: 8rpx 18rpx;
}

.cell {
  margin-bottom: 18rpx;
  height: 90rpx;
  background: #fff;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18rpx;
}

.left {
  font-size: 38rpx;
  color: #3a3a3a;
}

.arrow {
  font-size: 42rpx;
  color: #9c9c9c;
}
</style>
