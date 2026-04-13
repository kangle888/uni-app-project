<template>
  <view class="page">
    <view class="top-bar">
      <view class="nav-back" @tap="goBack">〈 返回</view>
      <view class="nav-title">线路列表</view>
      <view class="nav-placeholder"></view>
    </view>

    <view class="sub-head">
      <text>{{ dateText }}</text>
      <text>{{ fromCity }} - {{ toCity }}</text>
      <text>共{{ itineraries.length }}条</text>
    </view>

    <scroll-view class="list-wrap" scroll-y>
      <view v-if="!itineraries.length" class="empty">暂无结果</view>

      <view v-for="item in itineraries" :key="item.id" class="card">
        <view class="line1">
          <text class="time">{{
            item.legs[0]?.departureTime?.slice(0, 5)
          }}</text>
          <text class="mid">{{
            item.transferCities.length
              ? `${item.transferCities.join(' / ')} 转`
              : '直飞'
          }}</text>
          <text class="time">{{
            item.legs[item.legs.length - 1]?.arrivalTime?.slice(0, 5)
          }}</text>
        </view>

        <view class="line2">
          <text class="city">{{ item.legs[0]?.departureCity }}</text>
          <text class="duration">共{{ item.totalDurationText }}</text>
          <text class="city">{{
            item.legs[item.legs.length - 1]?.arrivalCity
          }}</text>
        </view>

        <view class="flight-line">
          <text
            v-for="(leg, idx) in item.legs"
            :key="`${item.id}-${idx}`"
            class="flight-no"
          >
            {{ leg.airline }} {{ leg.flightNo }}
          </text>
        </view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import {
  searchItineraries,
  type ItineraryItem,
} from '@/utils/precise-search.api'
import type { SearchEdition } from '@/utils/quick-search.api'

const fromCity = ref('')
const toCity = ref('')
const dateText = ref('')
const maxTransferCount = ref(1)
const editions = ref<SearchEdition[]>([666, 2666])
const itineraries = ref<ItineraryItem[]>([])

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({
      delta: 1,
      fail: () => {
        uni.switchTab({
          url: '/pages/precise-search/index',
        })
      },
    })
    return
  }

  uni.reLaunch({
    url: '/pages/precise-search/index',
  })
}

onLoad(async (query) => {
  fromCity.value = decodeURIComponent(String(query?.fromCity || '北京'))
  toCity.value = decodeURIComponent(String(query?.toCity || '上海'))
  dateText.value = decodeURIComponent(String(query?.date || '04-13'))
  maxTransferCount.value = Number(query?.maxTransferCount || 1)

  const editionText = String(query?.editions || '666,2666')
  editions.value = editionText
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item): item is SearchEdition => item === 666 || item === 2666)

  itineraries.value = await searchItineraries({
    fromCity: fromCity.value,
    toCity: toCity.value,
    maxTransferCount: maxTransferCount.value,
    editions: editions.value.length ? editions.value : [666, 2666],
  })
})
</script>

<style scoped lang="scss">
.page {
  height: 100vh;
  background: #eff2f6;
  display: flex;
  flex-direction: column;
}

.top-bar {
  height: 176rpx;
  background: #f51c17;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 18rpx 22rpx;
}

.nav-back {
  width: 140rpx;
  color: #fff;
  font-size: 30rpx;
}

.nav-title {
  color: #fff;
  font-size: 40rpx;
  font-weight: 700;
  text-align: center;
  flex: 1;
}

.nav-placeholder {
  width: 140rpx;
}

.sub-head {
  height: 70rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18rpx;
  font-size: 30rpx;
  color: #6a1f1f;
  font-weight: 600;
}

.list-wrap {
  flex: 1;
  padding: 14rpx 14rpx 0;
  box-sizing: border-box;
}

.card {
  background: #fff;
  border-radius: 18rpx;
  padding: 20rpx 18rpx;
  margin-bottom: 14rpx;
}

.line1,
.line2 {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time {
  font-size: 50rpx;
  color: #1f1f1f;
  font-weight: 700;
}

.mid {
  font-size: 28rpx;
  color: #bf5151;
}

.city {
  font-size: 36rpx;
  color: #333;
  font-weight: 600;
}

.duration {
  font-size: 30rpx;
  color: #c53535;
  font-weight: 700;
}

.flight-line {
  margin-top: 14rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.flight-no {
  font-size: 26rpx;
  color: #4f6e96;
}

.empty {
  text-align: center;
  color: #8d8d8d;
  padding-top: 80rpx;
}

.bottom-space {
  height: 30rpx;
}
</style>
