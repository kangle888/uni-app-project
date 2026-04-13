<template>
  <view class="page">
    <view class="top-bar">
      <view class="title">随心快查</view>
    </view>

    <view class="search-bar">
      <view class="seg picker" @click="showTypeSelector = true">
        <view class="picker-text">{{ `海航${searchEdition}` }}</view>
      </view>
      <view class="divider"></view>
      <view class="seg picker" @click="openSelector('from')">
        <view class="picker-text">{{ fromCity.name }}</view>
      </view>
      <view class="divider"></view>
      <view class="seg picker" @click="openSelector('to')">
        <view class="picker-text">{{ toCityLabel }}</view>
      </view>
    </view>

    <view class="tips"
      >自动规划【可往返、回旋镖、中转、到周边】，用底部精准查询</view
    >

    <view v-if="activeView === 'map'" class="map-wrap">
      <map
        class="map-real"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :markers="markers"
        :polyline="polyline"
        :scale="4"
        show-location
      />
    </view>

    <scroll-view v-else class="list-wrap" scroll-y>
      <view v-for="item in flightResults" :key="item.id" class="flight-card">
        <view class="card-top">
          <view class="col from">
            <view class="city">{{ item.departureCity }}</view>
            <view class="time">{{ getTimePart(item.departureTime) }}</view>
            <view class="airport">{{ item.departureAirport || '-' }}</view>
          </view>

          <view class="mid">
            <view class="duration">{{
              formatDuration(item.departureTime, item.arrivalTime)
            }}</view>
          </view>

          <view class="col to">
            <view class="city">{{ item.arrivalCity }}</view>
            <view class="time">{{ getTimePart(item.arrivalTime) }}</view>
            <view class="airport">{{ item.arrivalAirport || '-' }}</view>
          </view>

          <view class="flight-no-wrap">
            <view class="flight-no">{{ item.flightNo }}</view>
            <view class="airline">{{ item.airline }}</view>
          </view>
        </view>

        <view class="card-bottom">
          <view class="week-row">
            <view
              v-for="d in weekDays"
              :key="`${item.id}-${d}`"
              class="day-dot"
              :class="getDayClass(item.schedule, d)"
            >
              {{ d }}
            </view>
          </view>
          <view class="error-text">航班纠错</view>
        </view>
      </view>
      <view class="list-bottom-space"></view>
    </scroll-view>

    <view class="switcher">
      <view
        class="switch-item"
        :class="{ active: activeView === 'map' }"
        @click="activeView = 'map'"
        >地图</view
      >
      <view
        class="switch-item"
        :class="{ active: activeView === 'list' }"
        @click="activeView = 'list'"
        >列表 {{ flightResults.length }}</view
      >
    </view>

    <view
      v-if="showTypeSelector"
      class="type-mask"
      @click="showTypeSelector = false"
    >
      <view class="type-panel" @click.stop>
        <view class="panel-title">随心飞类型</view>
        <view class="type-row">
          <view
            class="type-item"
            :class="{ active: searchEdition === 666 }"
            @click="chooseEdition(666)"
            >海航666</view
          >
          <view
            class="type-item"
            :class="{ active: searchEdition === 2666 }"
            @click="chooseEdition(2666)"
            >海航2666</view
          >
        </view>
      </view>
    </view>

    <view v-if="showSelector" class="selector-mask" @click="closeSelector">
      <view class="selector-panel" @click.stop>
        <view class="panel-title"
          >选择{{ selectorMode === 'from' ? '始发地' : '到达地' }}</view
        >
        <view class="search-input-wrap">
          <input
            v-model="searchKeyword"
            class="search-input"
            placeholder="搜索省或市"
          />
        </view>
        <view class="selector-content">
          <scroll-view class="province-col" scroll-y>
            <view
              v-for="(item, idx) in filteredProvinces"
              :key="item.name"
              class="province-item"
              :class="{ active: idx === activeProvinceIndex }"
              @click="activeProvinceIndex = idx"
            >
              <text>{{ item.name }}</text>
              <text class="arrow">>>></text>
            </view>
          </scroll-view>
          <scroll-view class="city-col" scroll-y>
            <view
              v-for="city in currentProvinceCities"
              :key="city.id"
              class="city-item"
              @click="selectCity(city)"
            >
              <text class="radio"></text>
              <text>{{ city.name }}</text>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  getCityProvinces,
  searchFlights,
  type CityItem,
  type FlightItem,
  type SearchEdition,
} from '@/utils/quick-search.api'

type ProvinceItem = {
  name: string
  cities: CityItem[]
}

const fromCity = ref<CityItem>({
  id: 0,
  name: '上海',
  latitude: 31.1443,
  longitude: 121.8083,
  province: '上海',
})
const toCity = ref<CityItem | null>(null)
const searchEdition = ref<SearchEdition>(2666)

const showSelector = ref(false)
const showTypeSelector = ref(false)
const selectorMode = ref<'from' | 'to'>('from')
const searchKeyword = ref('')
const activeProvinceIndex = ref(0)
const activeView = ref<'map' | 'list'>('map')
const weekDays = [1, 2, 3, 4, 5, 6, 7] as const

const provinces = ref<ProvinceItem[]>([])
const filteredProvinces = ref<ProvinceItem[]>([])
const flightResults = ref<FlightItem[]>([])
const fromCityFlightResults = ref<FlightItem[]>([])

const toCityLabel = computed(() =>
  toCity.value ? toCity.value.name : '到达省份城市',
)

const currentProvinceCities = computed(
  () => filteredProvinces.value[activeProvinceIndex.value]?.cities || [],
)

const destinationCities = computed(() => {
  const map = new Map<string, CityItem>()
  flightResults.value.forEach((item) => {
    if (!map.has(item.arrivalCity)) {
      map.set(item.arrivalCity, {
        id: item.id,
        name: item.arrivalCity,
        latitude: item.arrivalLatitude,
        longitude: item.arrivalLongitude,
        province: '',
      })
    }
  })
  return Array.from(map.values())
})

const mapCenter = computed(() => {
  if (toCity.value)
    return {
      latitude: toCity.value.latitude,
      longitude: toCity.value.longitude,
    }
  return {
    latitude: fromCity.value.latitude,
    longitude: fromCity.value.longitude,
  }
})

const markers = computed(() => {
  const fromMarker = {
    id: 1,
    latitude: fromCity.value.latitude,
    longitude: fromCity.value.longitude,
    width: 24,
    height: 24,
    callout: {
      content: fromCity.value.name,
      color: '#ffffff',
      fontSize: 12,
      borderRadius: 6,
      bgColor: '#df2323',
      padding: 6,
      display: 'ALWAYS',
    },
  }
  const toMarkers = destinationCities.value.map((city, idx) => ({
    id: idx + 2,
    latitude: city.latitude,
    longitude: city.longitude,
    width: 18,
    height: 18,
    callout: {
      content: city.name,
      color: '#333333',
      fontSize: 11,
      borderRadius: 6,
      bgColor: '#ffffff',
      padding: 4,
      display: 'ALWAYS',
    },
  }))
  return [fromMarker, ...toMarkers]
})

const polyline = computed(() =>
  destinationCities.value.map((city) => ({
    points: [
      {
        latitude: fromCity.value.latitude,
        longitude: fromCity.value.longitude,
      },
      { latitude: city.latitude, longitude: city.longitude },
    ],
    color: '#2d7ae5',
    width: 3,
    dottedLine: false,
  })),
)

const loadProvinceData = async () => {
  provinces.value = await getCityProvinces('')
  await refreshFilteredProvinces()
}

const getReachableProvinces = async (keyword = '') => {
  const all = await getCityProvinces('')
  const kw = keyword.trim()

  const cityMap = new Map<string, CityItem>()
  all.forEach((province) => {
    province.cities.forEach((city) => cityMap.set(city.name, city))
  })

  const reachableNames = new Set(
    fromCityFlightResults.value.map((item) => item.arrivalCity),
  )
  const byProvince = new Map<string, CityItem[]>()

  reachableNames.forEach((cityName) => {
    const city = cityMap.get(cityName)
    if (!city) return
    if (!byProvince.has(city.province)) byProvince.set(city.province, [])
    byProvince.get(city.province)?.push(city)
  })

  const grouped: ProvinceItem[] = Array.from(byProvince.entries()).map(
    ([name, cities]) => ({
      name,
      cities,
    }),
  )

  if (!kw) return grouped

  return grouped
    .map((p) => ({
      ...p,
      cities: p.cities.filter(
        (c) => c.name.includes(kw) || c.province.includes(kw),
      ),
    }))
    .filter((p) => p.name.includes(kw) || p.cities.length > 0)
}

const refreshFilteredProvinces = async () => {
  if (selectorMode.value === 'to') {
    filteredProvinces.value = await getReachableProvinces(searchKeyword.value)
  } else {
    filteredProvinces.value = await getCityProvinces(searchKeyword.value)
  }
  if (activeProvinceIndex.value >= filteredProvinces.value.length)
    activeProvinceIndex.value = 0
}

const fetchFlightData = async () => {
  fromCityFlightResults.value = await searchFlights({
    edition: searchEdition.value,
    fromCity: fromCity.value.name,
  })

  flightResults.value = await searchFlights({
    edition: searchEdition.value,
    fromCity: fromCity.value.name,
    toCity: toCity.value?.name,
  })
}

const openSelector = async (mode: 'from' | 'to') => {
  selectorMode.value = mode
  searchKeyword.value = ''
  activeProvinceIndex.value = 0
  await refreshFilteredProvinces()
  showSelector.value = true
}

const closeSelector = () => {
  showSelector.value = false
}

const selectCity = (city: CityItem) => {
  if (selectorMode.value === 'from') {
    fromCity.value = city
    if (toCity.value?.name === city.name) toCity.value = null
  } else {
    toCity.value = city.name === fromCity.value.name ? null : city
  }
  closeSelector()
}

const chooseEdition = (edition: SearchEdition) => {
  searchEdition.value = edition
  showTypeSelector.value = false
}

const getTimePart = (val?: string) => {
  if (!val) return '--:--'
  return String(val).slice(0, 5)
}

const formatDuration = (dep?: string, arr?: string) => {
  const depTime = getTimePart(dep)
  const arrTime = getTimePart(arr)
  if (!depTime.includes(':') || !arrTime.includes(':')) return '--'

  const [dh, dm] = depTime.split(':').map(Number)
  const [ahRaw, amRaw] = arrTime.split(':').map(Number)
  const ah = Number.isNaN(ahRaw) ? 0 : ahRaw
  const am = Number.isNaN(amRaw) ? 0 : amRaw

  let minutes = ah * 60 + am - (dh * 60 + dm)
  if (String(arr || '').includes('+1') || minutes < 0) minutes += 24 * 60

  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${m ? `${m}m` : ''}`
}

const isDayActive = (schedule: string | number | undefined, day: number) => {
  const text = String(schedule || '')
  const parts = text
    .split('.')
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n))
  return parts.includes(day)
}

const getDayClass = (schedule: string | number | undefined, day: number) => {
  if (!isDayActive(schedule, day)) return 'off'
  return day === 6 || day === 7 ? 'weekend' : 'workday'
}

watch(searchKeyword, refreshFilteredProvinces)
watch([fromCity, toCity, searchEdition], fetchFlightData, { deep: true })

onMounted(async () => {
  await loadProvinceData()
  const defaultFrom = provinces.value.find((p) => p.name === '上海')?.cities[0]
  if (defaultFrom) fromCity.value = defaultFrom
  await fetchFlightData()
})
</script>

<style scoped lang="scss">
.page {
  height: 100vh;
  background: #eceff5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

.search-bar {
  height: 76rpx;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  font-size: 30rpx;
  color: #252525;
}

.seg {
  flex: 1;
}

.divider {
  width: 2rpx;
  height: 30rpx;
  background: #ddd;
}

.tips {
  font-size: 26rpx;
  color: #333;
  line-height: 1.5;
  padding: 12rpx 18rpx;
  background: #fff;
}

.map-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}

.map-real {
  width: 100%;
  height: 100%;
}

.list-wrap {
  flex: 1;
  padding: 12rpx 14rpx 0;
  box-sizing: border-box;
}

.flight-card {
  background: #fff;
  border-radius: 18rpx;
  margin-bottom: 14rpx;
  padding: 18rpx 18rpx 14rpx;
}

.card-top {
  display: flex;
  align-items: flex-start;
}

.col {
  flex: 1;
}

.city {
  font-size: 46rpx;
  font-weight: 700;
  color: #1f1f1f;
  line-height: 1.1;
}

.time {
  margin-top: 8rpx;
  font-size: 44rpx;
  color: #222;
  line-height: 1;
}

.airport {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #6a6a6a;
}

.mid {
  width: 98rpx;
  display: flex;
  justify-content: center;
  padding-top: 42rpx;
}

.duration {
  border: 2rpx solid #d6d6d6;
  color: #9a9a9a;
  font-size: 20rpx;
  line-height: 1;
  padding: 6rpx 8rpx;
}

.flight-no-wrap {
  width: 160rpx;
  text-align: right;
}

.flight-no {
  font-size: 50rpx;
  font-weight: 700;
  color: #272727;
  line-height: 1.05;
}

.airline {
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #6f6f6f;
}

.card-bottom {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.week-row {
  display: flex;
  gap: 10rpx;
}

.day-dot {
  width: 44rpx;
  height: 44rpx;
  border-radius: 22rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24rpx;
}

.day-dot.weekend {
  background: #1f5fbf;
  color: #fff;
}

.day-dot.workday {
  background: #dbe8fb;
  color: #7299d8;
}

.day-dot.off {
  background: #2a2a2a;
  color: #fff;
}

.error-text {
  color: #f24533;
  font-size: 26rpx;
}

.list-bottom-space {
  height: 110rpx;
}

.picker {
  height: 76rpx;
  display: flex;
  align-items: center;
}

.picker-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-mask,
.selector-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 99;
}

.type-panel {
  width: 84%;
  margin: 640rpx auto 0;
  background: #fff;
  border-radius: 22rpx;
  padding: 24rpx;
}

.type-row {
  display: flex;
  gap: 14rpx;
}

.type-item {
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
  background: #f3f3f3;
  color: #3c3c3c;
}

.type-item.active {
  background: #1d2233;
  color: #fff;
}

.selector-panel {
  background: #fff;
  margin-top: 176rpx;
  border-radius: 14rpx 14rpx 0 0;
  min-height: 760rpx;
}

.panel-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #2a2a2a;
  padding: 26rpx 24rpx 8rpx;
}

.search-input-wrap {
  padding: 0 22rpx 16rpx;
}

.search-input {
  height: 66rpx;
  border-radius: 33rpx;
  background: #f3f3f3;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.selector-content {
  display: flex;
  height: 620rpx;
}

.province-col {
  width: 50%;
  border-right: 2rpx solid #efefef;
}

.city-col {
  flex: 1;
}

.province-item,
.city-item {
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22rpx;
  font-size: 34rpx;
  color: #303030;
}

.province-item.active {
  background: #edf2fd;
}

.city-item {
  justify-content: flex-start;
  gap: 14rpx;
}

.arrow {
  color: #c7c7c7;
  font-size: 24rpx;
}

.radio {
  width: 26rpx;
  height: 26rpx;
  border: 2rpx solid #e2e2e2;
  border-radius: 50%;
}

.switcher {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(26rpx + constant(safe-area-inset-bottom));
  bottom: calc(26rpx + env(safe-area-inset-bottom));
  z-index: 20;
  width: 300rpx;
  height: 62rpx;
  background: linear-gradient(90deg, #fff 0%, #f4a6ab 100%);
  border: 2rpx solid #d99195;
  border-radius: 34rpx;
  display: flex;
  align-items: center;
  padding: 5rpx;
}

.switch-item {
  flex: 1;
  text-align: center;
  font-size: 30rpx;
  color: #fff;
  border-radius: 26rpx;
}

.switch-item.active {
  background: #fff;
  color: #333;
}
</style>
