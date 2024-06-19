import type { BannerItem, CategoryItem, HotItem, GuessItem } from '@/types/home'
import type { PageResult, PageParams } from '@/types/global'
import { http } from '@/utils/http'

export const getHomeBannerAPI = (distributionSite = 1) => {
  return http<BannerItem[]>({
    url: '/home/banner',
    method: 'GET',
    data: {
      distributionSite,
    },
  })
}

/**
 * 获取首页前台类目
 * home/category
 */
export const getHomeCategoryAPI = () => {
  return http<CategoryItem[]>({
    url: '/home/category/mutli',
    method: 'GET',
  })
}

/**
 * 获取首页热门推荐
 * home/hot
 *
 */
export const getHomeHotAPI = () => {
  return http<HotItem[]>({
    url: '/home/hot/mutli',
    method: 'GET',
  })
}

/**
 * 猜你喜欢
 * home/guess
 */
export const getHomeGoodsGuessLikeAPI = (data?: PageParams) => {
  return http<PageResult<GuessItem>>({
    method: 'GET',
    url: '/home/goods/guessLike',
    data,
  })
}
