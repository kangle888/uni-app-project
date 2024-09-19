<template>
  <!-- 使用 canvas 元素来渲染图表 -->
  <view class="top-title">KA装机量</view>
  <view class="line-pic-content">
    <view class="charts-box">
      <qiun-data-charts type="line" :opts="opts" :chartData="chartData" />
    </view>
  </view>
  <view class="top-title">KA项目</view>
  <view class="bottom-area">
    <img
      class="img"
      src="../../static/images/KA项目背景.png"
      alt=""
      srcset=""
    />
    <view class="show-data">
      <view class="left">
        <view class="left-img">
          <img class="img2" src="../../static/images/时间ico.svg" alt="" />
        </view>
        <view class="list-item" v-for="(item, index) in kaList1" :key="index">
          <span class="item-id">{{ index + 1 }}</span>
          <span>{{ item.code }}</span>
        </view>
      </view>
      <view class="center"></view>
      <view class="right">
        <view class="right-img">
          <img class="img3" src="../../static/images/钱包ico.png" alt="" />
        </view>
        <view class="list-item">
          <span class="item-id">1</span>
          <span>JRJ</span>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getKaListAPI } from '@/services/kaItem'

// 定义 chart 实例
const chart = ref<any>(null)

const kaList1 = ref([])

const kaList2 = ref([])

onMounted(() => {
  // 等待 DOM 加载完毕后初始化图表
  getServerData()
  getKaDataStateOne()
  getKaDataStateTwo()
})

const getKaDataStateOne = async () => {
  const res: any = await getKaListAPI({ state: 1 })
  kaList1.value = res.data
}
const getKaDataStateTwo = async () => {
  const res: any = await getKaListAPI({ state: 2 })
  kaList2.value = res.data
}

const chartData = ref({})
const opts = ref({
  color: [
    '#1890FF',
    '#91CB74',
    '#FAC858',
    '#EE6666',
    '#73C0DE',
    '#3CA272',
    '#FC8452',
    '#9A60B4',
    '#ea7ccc',
  ],
  padding: [15, 15, 0, 5],
  legend: {},
  xAxis: {
    disableGrid: true,
  },
  yAxis: {
    data: [
      {
        min: 0,
      },
    ],
  },
  extra: {
    column: {
      type: 'group',
      width: 30,
      activeBgColor: '#000000',
      activeBgOpacity: 0.08,
    },
  },
})

function getServerData() {
  //模拟从服务器获取数据时的延时
  setTimeout(() => {
    //模拟服务器返回数据，如果数据格式和标准格式不同，需自行按下面的格式拼接
    let res = {
      categories: ['2016', '2017', '2018', '2019', '2020', '2021'],
      series: [
        {
          name: '目标值',
          data: [35, 36, 31, 33, 13, 34],
        },
        {
          name: '完成量',
          data: [18, 27, 21, 24, 6, 28],
        },
      ],
    }
    chartData.value = JSON.parse(JSON.stringify(res))
  }, 500)
}
</script>

<style lang="scss" scoped>
.charts-box {
  width: 50%;
  min-width: 375px !important;
  height: 400rpx;
  margin-left: auto;
  margin-right: auto;
}

.top-title {
  width: 200rpx;
  height: 38rpx;
  font-family: Alibaba PuHuiTi, Alibaba PuHuiTi;
  font-weight: 500;
  font-size: 38rpx;
  color: #000000;
  line-height: 38rpx;
  font-style: normal;
  margin: 32rpx 0 26rpx 32rpx;
  text-align: center;
}
.line-pic-content {
  width: 681rpx;
  height: 429rpx;
  background: #f6f7f8;
  border-radius: 19rpx 19rpx 19rpx 19rpx;
  text-align: center;
}
.bottom-area {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  .img {
    width: 680rpx;
    height: 621rpx;
  }
  .show-data {
    position: absolute;
    top: 0;
    left: 34.6rpx;
    width: 680rpx;
    height: 621rpx;
    display: flex;

    .left {
      width: 50%;
      .left-img {
        margin: 34.6rpx 0 21rpx 57.7rpx;
        .img2 {
          width: 53.8rpx;
          height: 53.8rpx;
        }
      }
    }
    .center {
      height: 548rpx;
      width: 0rpx;
      border: 2rpx solid #e0e4ee;
      margin-top: 42.3rpx;
    }
    .right {
      width: 50%;
      .right-img {
        margin: 34.6rpx 0 21rpx 57.7rpx;
        .img3 {
          width: 53.8rpx;
          height: 53.8rpx;
        }
      }
    }
    .list-item {
      display: flex;
      border-bottom: 2rpx solid #e0e2e9;
      margin-left: 42.3rpx;
      width: 258rpx;
      height: 50rpx;
      line-height: 56rpx;
      .item-id {
        display: inline-block;
        margin-right: 34.6rpx;
        margin-left: 15.3rpx;
      }
    }
  }
}
</style>
