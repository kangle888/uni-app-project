<template>
  <view class="page">
    <view class="top-bar">
      <view class="title">中转易</view>
    </view>

    <view class="hero">
      <view class="hero-title">中转易 · 中转助手</view>
      <view class="hero-sub">查询经意向城市中转航班</view>
    </view>

    <view class="card">
      <view class="row row-between city-row">
        <view class="city-col" @click="openCitySelector('from')">
          <text class="muted">出发城市</text>
          <text class="city-value">{{ fromCity }}</text>
        </view>
        <text class="swap" @click="swapCities">⟲</text>
        <view
          class="city-col city-col-right"
          @click="openCitySelector('intent')"
        >
          <text class="muted">意向城市</text>
          <text class="city-value">{{ intentCity }}</text>
        </view>
      </view>

      <view class="line"></view>
      <view class="row muted">2026-04-13</view>
      <view class="line"></view>

      <button class="query-btn">点击查询</button>
    </view>

    <view
      v-if="showCitySelector"
      class="selector-mask"
      :style="{
        top: `${selectorTop}px`,
        height: `calc(100vh - ${selectorTop}px)`,
      }"
      @click="closeCitySelector"
    >
      <view class="selector-panel" @click.stop>
        <view class="selector-search-row">
          <input
            v-model="cityKeyword"
            class="selector-input"
            placeholder="省份 / 城市中文、首字母、拼音"
            placeholder-class="placeholder"
          />
          <text class="clear-text" @click="resetKeyword">清除</text>
        </view>

        <scroll-view class="selector-scroll" scroll-y>
          <view
            v-for="group in groupedCities"
            :key="group.letter"
            class="group-block"
          >
            <view class="group-letter">{{ group.letter }}</view>
            <view
              v-for="item in group.items"
              :key="item.name"
              class="city-item"
              @click="selectCity(item.name)"
            >
              {{ item.name }}
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type CityItem = {
  name: string
  province: string
  pinyin: string
  initial: string
}

const cityList: CityItem[] = [
  { name: '阿勒泰', province: '新疆', pinyin: 'aletai', initial: 'A' },
  { name: '阿拉尔', province: '新疆', pinyin: 'alaer', initial: 'A' },
  { name: '安康', province: '陕西', pinyin: 'ankang', initial: 'A' },
  { name: '安庆', province: '安徽', pinyin: 'anqing', initial: 'A' },
  { name: '安顺', province: '贵州', pinyin: 'anshun', initial: 'A' },
  { name: '阿尔山', province: '内蒙古', pinyin: 'aershan', initial: 'A' },
  { name: '安阳', province: '河南', pinyin: 'anyang', initial: 'A' },
  { name: '滨州', province: '山东', pinyin: 'binzhou', initial: 'B' },
  { name: '北海', province: '广西', pinyin: 'beihai', initial: 'B' },
  { name: '北京', province: '北京', pinyin: 'beijing', initial: 'B' },
  { name: '保山', province: '云南', pinyin: 'baoshan', initial: 'B' },
  { name: '巴中', province: '四川', pinyin: 'bazhong', initial: 'B' },
  { name: '白山', province: '吉林', pinyin: 'baishan', initial: 'B' },
  { name: '长春', province: '吉林', pinyin: 'changchun', initial: 'C' },
  { name: '成都', province: '四川', pinyin: 'chengdu', initial: 'C' },
  { name: '重庆', province: '重庆', pinyin: 'chongqing', initial: 'C' },
  { name: '长沙', province: '湖南', pinyin: 'changsha', initial: 'C' },
  { name: '大连', province: '辽宁', pinyin: 'dalian', initial: 'D' },
  { name: '东营', province: '山东', pinyin: 'dongying', initial: 'D' },
  { name: '鄂尔多斯', province: '内蒙古', pinyin: 'eerduosi', initial: 'E' },
  { name: '福州', province: '福建', pinyin: 'fuzhou', initial: 'F' },
  { name: '广州', province: '广东', pinyin: 'guangzhou', initial: 'G' },
  { name: '贵阳', province: '贵州', pinyin: 'guiyang', initial: 'G' },
  { name: '哈尔滨', province: '黑龙江', pinyin: 'haerbin', initial: 'H' },
  { name: '海口', province: '海南', pinyin: 'haikou', initial: 'H' },
  { name: '杭州', province: '浙江', pinyin: 'hangzhou', initial: 'H' },
  { name: '济南', province: '山东', pinyin: 'jinan', initial: 'J' },
  { name: '昆明', province: '云南', pinyin: 'kunming', initial: 'K' },
  { name: '拉萨', province: '西藏', pinyin: 'lasa', initial: 'L' },
  { name: '兰州', province: '甘肃', pinyin: 'lanzhou', initial: 'L' },
  { name: '南昌', province: '江西', pinyin: 'nanchang', initial: 'N' },
  { name: '南京', province: '江苏', pinyin: 'nanjing', initial: 'N' },
  { name: '青岛', province: '山东', pinyin: 'qingdao', initial: 'Q' },
  { name: '上海', province: '上海', pinyin: 'shanghai', initial: 'S' },
  { name: '深圳', province: '广东', pinyin: 'shenzhen', initial: 'S' },
  { name: '天津', province: '天津', pinyin: 'tianjin', initial: 'T' },
  { name: '乌鲁木齐', province: '新疆', pinyin: 'wulumuqi', initial: 'W' },
  { name: '武汉', province: '湖北', pinyin: 'wuhan', initial: 'W' },
  { name: '西安', province: '陕西', pinyin: 'xian', initial: 'X' },
  { name: '厦门', province: '福建', pinyin: 'xiamen', initial: 'X' },
  { name: '银川', province: '宁夏', pinyin: 'yinchuan', initial: 'Y' },
  { name: '郑州', province: '河南', pinyin: 'zhengzhou', initial: 'Z' },
]

const fromCity = ref('安康')
const intentCity = ref('北京')
const showCitySelector = ref(false)
const cityKeyword = ref('')
const selectorTarget = ref<'from' | 'intent'>('from')
const selectorTop = ref(88)

const groupedCities = computed(() => {
  const keyword = cityKeyword.value.trim().toLowerCase()
  const filtered = keyword
    ? cityList.filter(
        (item) =>
          item.name.includes(keyword) ||
          item.province.includes(keyword) ||
          item.pinyin.includes(keyword) ||
          item.initial.toLowerCase().includes(keyword),
      )
    : cityList

  const map = new Map<string, CityItem[]>()
  filtered.forEach((item) => {
    if (!map.has(item.initial)) map.set(item.initial, [])
    map.get(item.initial)?.push(item)
  })

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([letter, items]) => ({ letter, items }))
})

const openCitySelector = (target: 'from' | 'intent') => {
  selectorTarget.value = target
  cityKeyword.value = ''
  showCitySelector.value = true
}

const closeCitySelector = () => {
  showCitySelector.value = false
}

const resetKeyword = () => {
  cityKeyword.value = ''
}

const selectCity = (name: string) => {
  if (selectorTarget.value === 'from') {
    fromCity.value = name
    if (intentCity.value === name) {
      intentCity.value = ''
    }
  } else {
    intentCity.value = name === fromCity.value ? '' : name
  }
  closeCitySelector()
}

const swapCities = () => {
  if (!intentCity.value) return
  const temp = fromCity.value
  fromCity.value = intentCity.value
  intentCity.value = temp
}

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  const menuRect = uni.getMenuButtonBoundingClientRect?.()

  if (menuRect?.bottom) {
    selectorTop.value = menuRect.bottom + 6
    return
  }

  const statusBarHeight = sys.statusBarHeight || 0
  selectorTop.value = statusBarHeight + 44
})
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #eceff5;
}

.top-bar {
  min-height: 176rpx;
  background: #f51c17;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  box-sizing: border-box;
  padding-top: calc(env(safe-area-inset-top) + 8rpx);
  padding-bottom: 22rpx;
}

.title {
  color: #fff;
  font-size: 42rpx;
  font-weight: 700;
}

.hero {
  padding: 28rpx 24rpx 12rpx;
}

.hero-title {
  font-size: 58rpx;
  font-weight: 700;
  color: #8e1f27;
}

.hero-sub {
  margin-top: 10rpx;
  color: #1f5f99;
  font-size: 34rpx;
}

.card {
  margin: 8rpx 18rpx 0;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx 24rpx 40rpx;
}

.row {
  height: 74rpx;
  display: flex;
  align-items: center;
  font-size: 34rpx;
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
  font-size: 32rpx;
  font-weight: 600;
}

.muted {
  color: #616161;
}

.swap {
  color: #bf3d3b;
  font-size: 46rpx;
  padding: 10rpx 20rpx;
}

.line {
  height: 2rpx;
  background: #efefef;
}

.query-btn {
  margin-top: 84rpx;
  height: 86rpx;
  line-height: 86rpx;
  border-radius: 46rpx;
  border: 2rpx solid #ba4e4a;
  color: #c43d3a;
  background: #fff;
  font-size: 44rpx;
  font-weight: 700;
}

.selector-mask {
  position: fixed;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}

.selector-panel {
  width: 84%;
  height: 100%;
  background: #f51c17;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-top: 10rpx;
}

.selector-search-row {
  height: 96rpx;
  padding: 12rpx 16rpx 14rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.selector-input {
  flex: 1;
  height: 64rpx;
  border-radius: 34rpx;
  padding: 0 24rpx;
  background: #ffffff;
  font-size: 28rpx;
}

.placeholder {
  color: #8d8d8d;
}

.clear-text {
  color: #ffffff;
  font-size: 32rpx;
}

.selector-scroll {
  flex: 1;
  overflow: hidden;
  background: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
}

.group-block {
  padding-bottom: 12rpx;
}

.group-letter {
  margin: 10rpx 14rpx;
  height: 54rpx;
  line-height: 54rpx;
  border-radius: 28rpx;
  background: #f51c17;
  color: #fff;
  font-size: 36rpx;
  padding: 0 20rpx;
}

.city-item {
  height: 74rpx;
  line-height: 74rpx;
  font-size: 38rpx;
  font-weight: 500;
  color: #2f2f2f;
  padding: 0 18rpx;
  border-bottom: 2rpx dashed #ececec;
}
</style>
