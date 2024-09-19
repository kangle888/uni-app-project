<template>
  <view>
    <view class="content-top">
      <view
        class="show-data"
        style="
          background: url('../../static/images/a.png') no-repeat center center;
          background-size: contain;
          padding-top: 10rpx;
        "
      >
        <view
          class="list-item"
          v-for="(item, index) in saleProject1"
          :key="index"
        >
          <span class="item-id">{{ index + 1 }}</span>
          <span>{{ item.code + 1 }}</span>
        </view>
      </view>

      <view
        class="show-data"
        style="
          background: url('../../static/images/b.png') no-repeat center center;
          background-size: contain;
          padding-top: 10rpx;
        "
      >
        <view
          class="list-item"
          v-for="(item, index) in saleProject2"
          :key="index"
        >
          <span class="item-id">{{ index + 1 }}</span>
          <span>{{ item.code + 1 }}</span>
        </view>
      </view>
    </view>
    <view class="content-top1">
      <view
        class="show-data"
        style="
          background: url('../../static/images/c.png') no-repeat center center;
          background-size: contain;
          padding-top: 10rpx;
        "
      >
        <view
          class="list-item"
          v-for="(item, index) in saleProject3"
          :key="index"
        >
          <span class="item-id">{{ index + 1 }}</span>
          <span>{{ item.code }}</span>
        </view>
      </view>

      <view
        class="show-data"
        style="
          background: url('../../static/images/d.png') no-repeat center center;
          background-size: contain;
          padding-top: 10rpx;
        "
      >
        <view
          class="list-item"
          v-for="(item, index) in saleProject4"
          :key="index"
        >
          <span class="item-id">{{ index + 1 }}</span>
          <span>{{ item.code }}</span>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { getSaleProjectAPI } from '@/services/kaItem'
import { onMounted, ref } from 'vue'
const saleProject1 = ref([])
const saleProject2 = ref([])
const saleProject3 = ref([])
const saleProject4 = ref([])

onMounted(async () => {
  const res1: any = await getSaleProjectAPI({ type: '朱雀' })
  const res2: any = await getSaleProjectAPI({ type: '九章' })
  const res3: any = await getSaleProjectAPI({ type: '候风' })
  const res4: any = await getSaleProjectAPI({ type: '混沌' })
  saleProject1.value = res1.data
  saleProject2.value = res2.data
  saleProject3.value = res3.data
  saleProject4.value = res4.data
})
</script>

<style lang="scss" scoped>
.content-top {
  display: flex;
  justify-content: space-around;
  margin-top: 19rpx;
}
.show-data {
  width: 328rpx;
  height: 601rpx;
  // background: url('../../static/images/a.png') no-repeat center center;
  .list-item {
    display: flex;
    border-bottom: 2rpx solid #e0e2e9;
    margin-left: 42.3rpx;
    width: 258rpx;
    height: 55.7rpx;
    line-height: 63rpx;
    .item-id {
      display: inline-block;
      margin-right: 34.6rpx;
      margin-left: 15.3rpx;
    }
  }
}
.content-top1 {
  display: flex;
  justify-content: space-around;
  margin-top: 32rpx;
}
.show-data {
  width: 328rpx;
  height: 601rpx;
  // background: url('../../static/images/a.png') no-repeat center center;
  .list-item {
    display: flex;
    border-bottom: 2rpx solid #e0e2e9;
    margin-left: 42.3rpx;
    width: 258rpx;
    height: 55.7rpx;
    line-height: 63rpx;
    .item-id {
      display: inline-block;
      margin-right: 34.6rpx;
      margin-left: 15.3rpx;
    }
  }
}
</style>
