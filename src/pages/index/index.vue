<script setup lang="ts">
import { getHomeBannerAPI } from '@/services/home'
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import type { BannerItem } from '@/types/home'
import XtxSwiper from '@/components/XtxSwiper.vue'
import CustomNavBar from './components/CustomNavBar.vue'

const bannerList = ref<BannerItem[]>([])
const getHomeBannerData = async () => {
  const data = await getHomeBannerAPI()
  console.log(data)
  bannerList.value = data.result
}

onLoad(() => {
  getHomeBannerData()
})
</script>

<template>
  <CustomNavBar />
  <!-- 自定义轮播图 -->
  <XtxSwiper :list="bannerList" />
</template>

<style lang="scss">
//
</style>
