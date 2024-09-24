<template>
  <div>
    <div class="content-top">
      <div class="show-data">
        <div
          class="list-item v-a-line"
          v-for="(item, index) in saleProject1"
          :key="index"
        >
          <span class="item-id">
            {{ (index + 1).toString().padStart(2, '0') }}
          </span>
          <span>{{ item.code }}</span>
        </div>
      </div>
      <img class="v-a-img" src="../../static/images/a.png" alt="" />
      <img class="v-b-img" src="../../static/images/b.png" alt="" />
      <div class="show-data">
        <div
          class="list-item v-b-line"
          v-for="(item, index) in saleProject2"
          :key="index"
        >
          <span class="item-id">{{
            (index + 1).toString().padStart(2, '0')
          }}</span>
          <span>{{ item.code }}</span>
        </div>
      </div>
    </div>
    <div class="content-top1">
      <div class="show-data">
        <div
          class="list-item v-c-line"
          v-for="(item, index) in saleProject3"
          :key="index"
        >
          <span class="item-id">{{
            (index + 1).toString().padStart(2, '0')
          }}</span>
          <span>{{ item.code }}</span>
        </div>
      </div>
      <img class="v-c-img" src="../../static/images/c.png" alt="" />
      <img class="v-d-img" src="../../static/images/d.png" alt="" />
      <div class="show-data">
        <div
          class="list-item v-d-line"
          v-for="(item, index) in saleProject4"
          :key="index"
        >
          <span class="item-id">{{
            (index + 1).toString().padStart(2, '0')
          }}</span>
          <span>{{ item.code }}</span>
        </div>
      </div>
    </div>
  </div>
  <logout-button />
</template>

<script setup lang="ts">
import { getSaleProjectAPI } from '@/services/kaItem'
import { onMounted, ref } from 'vue'
import { type SaleProjectItem } from '@/types/kaItems'
import {
  onShareAppMessage,
  onShareTimeline,
  onPullDownRefresh,
} from '@dcloudio/uni-app'
import logoutButton from '@/commonComponent/logoutButton/logoutButton.vue'

// 下拉刷新
onPullDownRefresh(async () => {
  try {
    const { res1, res2, res3, res4 } = await fetchSaleProjects()
    saleProject1.value = res1?.data
    saleProject2.value = res2?.data
    saleProject3.value = res3?.data
    saleProject4.value = res4?.data
  } catch (error) {
    // 可以在这里处理错误
  }
  uni.stopPullDownRefresh()
})

// 分享给好友
onShareAppMessage(() => {
  return {
    title: '动善时销售项目', // 分享标题
    path: '/pages/sale/sale', // 分享路径
    imageUrl: '../../static/images/1.png', // 分享图片
  }
})

// 分享到朋友圈
onShareTimeline(() => {
  return {
    title: '动善时销售项目', // 分享标题
    query: '', // 可选：分享携带的参数
    imageUrl: '../../static/images/1.png', // 分享图片
  }
})

const saleProject1 = ref<SaleProjectItem[]>([])
const saleProject2 = ref<SaleProjectItem[]>([])
const saleProject3 = ref<SaleProjectItem[]>([])
const saleProject4 = ref<SaleProjectItem[]>([])

onMounted(async () => {
  try {
    const { res1, res2, res3, res4 } = await fetchSaleProjects()
    saleProject1.value = res1?.data
    saleProject2.value = res2?.data
    saleProject3.value = res3?.data
    saleProject4.value = res4?.data
  } catch (error) {
    // 可以在这里处理错误
  }
})

const fetchSaleProjects = async () => {
  try {
    const [res1, res2, res3, res4] = await Promise.all([
      getSaleProjectAPI({ type: '朱雀' }),
      getSaleProjectAPI({ type: '九章' }),
      getSaleProjectAPI({ type: '候风' }),
      getSaleProjectAPI({ type: '混沌' }),
    ])
    return {
      res1,
      res2,
      res3,
      res4,
    }
  } catch (error) {
    console.error('Error fetching sale projects:', error)
    throw error
  }
}
</script>

<style lang="scss">
.content-top {
  display: flex;
  justify-content: space-around;
  margin-top: 19rpx;
  position: relative;
  .v-a-img {
    position: absolute;
    top: 0;
    left: 32.6rpx;
    width: 328rpx;
    height: 601rpx;
    z-index: -1;
  }
  .v-b-img {
    position: absolute;
    top: 0;
    right: 32.6rpx;
    width: 328rpx;
    height: 601rpx;
    z-index: -1;
  }
}
.content-top1 {
  display: flex;
  justify-content: space-around;
  margin-top: 32rpx;
  position: relative;
  .v-c-img {
    position: absolute;
    top: 0;
    left: 32.6rpx;
    width: 328rpx;
    height: 601rpx;
    z-index: -1;
  }
  .v-d-img {
    position: absolute;
    top: 0;
    right: 32.6rpx;
    width: 328rpx;
    height: 601rpx;
    z-index: -1;
  }
}
.show-data {
  width: 328rpx;
  height: 601rpx;
  padding-top: 10rpx;
  .list-item {
    display: flex;
    margin-left: 42.3rpx;
    width: 258rpx;
    height: 55.7rpx;
    line-height: 63rpx;
    .item-id {
      display: inline-block;

      margin-left: 15.3rpx;
      width: 60rpx;
    }
  }
}
.v-a-line {
  border-bottom: 2rpx solid #f7d7bd;
}
.v-b-line {
  border-bottom: 2rpx solid #c2d9fb;
}
.v-c-line {
  border-bottom: 2rpx solid #f5bfbf;
}
.v-d-line {
  border-bottom: 2rpx solid #b7e2bd;
}
</style>
