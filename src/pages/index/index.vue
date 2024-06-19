<script setup lang="ts">
import {
  getHomeBannerAPI,
  getHomeCategoryAPI,
  getHomeHotAPI,
} from '@/services/home'
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import type { BannerItem, CategoryItem, HotItem } from '@/types/home'
import XtxSwiper from '@/components/XtxSwiper.vue'
import XtxGuess from '@/components/XtxGuess.vue'
import CustomNavBar from './components/CustomNavBar.vue'
import CategoryPanel from './components/CategoryPanel.vue'
import HotPanel from './components/HotPanel.vue'
import type { XtxSwiperInstance } from '@/components/component'
import PagesSkeleton from './components/PagesSkeleton.vue'

const bannerList = ref<BannerItem[]>([])
const categoryList = ref<CategoryItem[]>([])
const hotList = ref<HotItem[]>([])
const guessRef = ref<XtxSwiperInstance>()
const isTriggered = ref(false)
const isLoading = ref(false)

const getHomeBannerData = async () => {
  const data = await getHomeBannerAPI()

  bannerList.value = data.result
}
// 获取前台分类数据
const getCategoryData = async () => {
  const data = await getHomeCategoryAPI()
  categoryList.value = data.result
}
// 热门推荐
const getHotData = async () => {
  const data = await getHomeHotAPI()
  console.log(data, 'data1')
  hotList.value = data.result
}
// 触底加载更多
const onScrolltolower = () => {
  console.log('触底了')
  guessRef.value?.getMore()
}
// 下拉刷新
const onRefresherrefresh = async () => {
  console.log('下拉刷新')
  isTriggered.value = true
  // 这里下拉重新加载数据
  await Promise.all([getHomeBannerData(), getCategoryData(), getHotData()])
  isTriggered.value = false
}

onLoad(async () => {
  isLoading.value = true
  await Promise.all([getHomeBannerData(), getCategoryData(), getHotData()])
  isLoading.value = false
})
</script>

<template>
  <CustomNavBar />
  <scroll-view
    refresher-enabled
    @refresherrefresh="onRefresherrefresh"
    :refresher-triggered="isTriggered"
    @scrolltolower="onScrolltolower"
    class="scroll-view"
    scroll-y
  >
    <PagesSkeleton v-if="isLoading" />
    <template v-else>
      <!-- 自定义轮播图 -->
      <XtxSwiper :list="bannerList" />
      <!-- 分类面板 -->
      <CategoryPanel :list="categoryList" />
      <!-- 热门推荐 -->
      <HotPanel :list="hotList" />
      <!-- 猜你喜欢 -->
      <XtxGuess ref="guessRef" />
    </template>
  </scroll-view>
</template>

<style lang="scss">
page {
  background-color: #f7f7f7;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.scroll-view {
  flex: 1;
  padding-bottom: 100rpx;
}
</style>
