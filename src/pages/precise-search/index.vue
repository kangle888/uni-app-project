<template>
  <view class="page">
    <view class="top-bar">
      <view class="title">中转易</view>
    </view>

    <view class="hero">
      <view class="hero-title">中转易 · 随心飞航线规划</view>
      <view class="hero-sub">（数据更新时间 2026-04-13）</view>
      <view class="hero-tag">可多版本随心飞互飞</view>
    </view>

    <view class="card">
      <view class="row row-between city-row">
        <view class="city-col" @click="swapCities">
          <text class="city-value">{{ fromCity }}</text>
        </view>
        <text class="swap">⟲</text>
        <view class="city-col city-col-right" @click="swapCities">
          <text class="city-value">{{ toCity }}</text>
        </view>
      </view>
      <view class="line"></view>
      <view class="row muted">{{ travelDate }}</view>
      <view class="line"></view>

      <view class="row row-between slider-row">
        <text>最大中转数</text>
        <text class="slider-value fixed">1 次（仅中转一次）</text>
      </view>

      <view class="label">随心飞版本（可多选）</view>
      <view class="chips">
        <view
          v-for="edition in editions"
          :key="edition"
          class="chip"
          :class="{ active: selectedEditions.includes(edition) }"
          @click="toggleEdition(edition)"
        >
          海航{{ edition }}
        </view>
      </view>

      <button class="query-btn" @click="handleQuery">点击查询</button>
    </view>

    <view class="bottom-switch">
      <view class="item active">操作指南</view>
      <view class="item">常见问题</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type Edition = 666 | 2666

const fromCity = ref('北京')
const toCity = ref('上海')
const travelDate = ref('2026-04-13')

const editions: Edition[] = [666, 2666]
const selectedEditions = ref<Edition[]>([666, 2666])
const maxTransferCount = ref(1)

const toggleEdition = (edition: Edition) => {
  if (selectedEditions.value.includes(edition)) {
    selectedEditions.value = selectedEditions.value.filter(
      (item) => item !== edition,
    )
    return
  }
  selectedEditions.value = [...selectedEditions.value, edition]
}

const swapCities = () => {
  const temp = fromCity.value
  fromCity.value = toCity.value
  toCity.value = temp
}

const handleQuery = () => {
  if (!selectedEditions.value.length) {
    uni.showToast({
      title: '请至少选择一个版本',
      icon: 'none',
    })
    return
  }

  const query = [
    `fromCity=${encodeURIComponent(fromCity.value)}`,
    `toCity=${encodeURIComponent(toCity.value)}`,
    `maxTransferCount=${maxTransferCount.value}`,
    `editions=${selectedEditions.value.join(',')}`,
    `date=${encodeURIComponent(travelDate.value)}`,
  ].join('&')

  uni.navigateTo({
    url: `/pages/route-list/index?${query}`,
  })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #eceff5;
  padding-bottom: 30rpx;
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

.hero {
  padding: 24rpx 24rpx 8rpx;
}

.hero-title {
  font-size: 52rpx;
  font-weight: 700;
  color: #8e1f27;
}

.hero-sub {
  margin-top: 8rpx;
  color: #aaa;
  font-size: 22rpx;
}

.hero-tag {
  margin-top: 6rpx;
  color: #b01f22;
  font-size: 36rpx;
  font-weight: 700;
}

.card {
  margin: 10rpx 18rpx 18rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
}

.row {
  min-height: 70rpx;
  display: flex;
  align-items: center;
  font-size: 40rpx;
  color: #3a3a3a;
}

.muted {
  color: #9d9d9d;
}

.row-between {
  justify-content: space-between;
}

.city-row {
  height: 96rpx;
}

.city-col {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 220rpx;
}

.city-col-right {
  align-items: flex-end;
}

.city-value {
  color: #2f2f2f;
  font-size: 38rpx;
  font-weight: 700;
}

.swap {
  color: #bf3d3b;
  font-size: 46rpx;
}

.line {
  height: 2rpx;
  background: #efefef;
}

.slider-row {
  margin-top: 12rpx;
  height: auto;
  font-size: 36rpx;
  align-items: center;
  gap: 16rpx;
}

.slider-right {
  flex: 1;
  display: flex;
  align-items: center;
}

slider {
  flex: 1;
}

.slider-value {
  margin-left: 12rpx;
  color: #c33735;
  font-size: 28rpx;
  min-width: 90rpx;
  text-align: right;
}

.label {
  margin-top: 14rpx;
  font-size: 31rpx;
  color: #666;
}

.chips {
  margin-top: 14rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.chip {
  padding: 10rpx 24rpx;
  border-radius: 30rpx;
  border: 2rpx solid #ececec;
  color: #767676;
  font-size: 31rpx;
}

.chip.active {
  border-color: #d17373;
  background: #fff2f2;
  color: #d92b2b;
  font-weight: 600;
}

.query-btn {
  margin-top: 34rpx;
  height: 86rpx;
  line-height: 86rpx;
  border-radius: 46rpx;
  border: 2rpx solid #ba4e4a;
  color: #c43d3a;
  background: #fff;
  font-size: 44rpx;
  font-weight: 700;
}

.bottom-switch {
  margin: 14rpx 18rpx 0;
  height: 74rpx;
  background: #fff;
  border-radius: 14rpx;
  display: flex;
}

.item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  color: #626262;
}

.item.active {
  border-right: 2rpx solid #e6e6e6;
}
</style>
