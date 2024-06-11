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
  <view class="index">index</view>
  <uni-section title="双标题卡片" type="line">
    <uni-card
      title="基础卡片"
      sub-title="副标题"
      extra="额外信息"
      thumbnail="https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/unicloudlogo.png"
    >
      <text class="uni-body">这是一个带头像和双标题的基础卡片，此示例展示了一个完整的卡片。</text>
    </uni-card>
  </uni-section>
</template>

<style lang="scss">
//
</style>
