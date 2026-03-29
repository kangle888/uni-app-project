import { http } from '@/utils/http'

export interface SysActivityPageParams {
  pageNum: number
  pageSize: number
  order?: string
  orderBy?: string
  query?: Record<string, any>
}

// /sysBanner/bannerImgs  get
export const getBannerImgs = () => {
  return http({
    url: '/sysBanner/bannerImgs',
    method: 'GET',
  })
}

// /sysActivity/page post
export const getActivityPage = (data: SysActivityPageParams) => {
  const { pageNum, pageSize, order, orderBy, query = {} } = data
  return http({
    url: '/sysActivity/page',
    method: 'POST',
    data: {
      pageNum,
      pageSize,
      order,
      orderBy,
      query,
    },
  })
}

// 查看活动详情 /demo/sysActivity/getById
export const getActivityDetail = (activityId: string) => {
  return http({
    url: `/sysActivity/getById?id=${activityId}`,
    method: 'GET',
  })
}

// /sysActivity/viewActivity 活动信息统计  get
export const viewActivity = (activityId: string) => {
  return http({
    url: `/sysActivity/viewActivity?activityId=${activityId}`,
    method: 'GET',
  })
}

// /enterActivity/enter 报名活动 get
export const enterActivity = (activityId: string) => {
  return http({
    url: `/enterActivity/enter?activityId=${activityId}`,
    method: 'GET',
  })
}

// 取消报名 /enterActivity/cancel
export const cancelActivity = (enterId: string) => {
  return http({
    url: `/enterActivity/cancel?enterId=${enterId}`,
    method: 'GET',
  })
}

// 查询当前活动报名状态
export const getMyEnterActivity = (activityId: string) => {
  return http({
    url: `/enterActivity/my?activityId=${activityId}`,
    method: 'GET',
  })
}

// 按活动取消当前用户报名
export const cancelActivityByActivity = (activityId: string) => {
  return http({
    url: `/enterActivity/cancelByActivity?activityId=${activityId}`,
    method: 'GET',
  })
}

// /demo/enterActivity/listEnter 获取报名活动列表 post
export const getEnterList = (data: SysActivityPageParams & Record<string, any>) => {
  const { pageNum, pageSize, order, orderBy, query: innerQuery, ...restQuery } = data
  return http({
    url: `/enterActivity/listEnter`,
    method: 'POST',
    data: {
      pageNum,
      pageSize,
      order,
      orderBy,
      query: innerQuery || restQuery,
    },
  })
}

// 收藏活动
export const favoriteActivity = (activityId: string) => {
  return http({
    url: `/favoriteActivity/favorite?activityId=${activityId}`,
    method: 'GET',
  })
}

// 取消收藏
export const cancelFavoriteActivity = (favoriteId: string) => {
  return http({
    url: `/favoriteActivity/cancel?favoriteId=${favoriteId}`,
    method: 'GET',
  })
}

// 收藏活动列表
export const getFavoriteList = (data: SysActivityPageParams & Record<string, any>) => {
  const { pageNum, pageSize, order, orderBy, query: innerQuery, ...restQuery } = data
  return http({
    url: `/favoriteActivity/listFavorite`,
    method: 'POST',
    data: {
      pageNum,
      pageSize,
      order,
      orderBy,
      query: innerQuery || restQuery,
    },
  })
}

// 用户行为统计（收藏/报名/浏览）
export const getUserBehaviorCount = () => {
  return http({
    url: '/userBehavior/count',
    method: 'GET',
  })
}

// 历史浏览活动列表
export const getViewList = (data: SysActivityPageParams & Record<string, any>) => {
  const { pageNum, pageSize, order, orderBy, query: innerQuery, ...restQuery } = data
  return http({
    url: `/viewActivity/listView`,
    method: 'POST',
    data: {
      pageNum,
      pageSize,
      order,
      orderBy,
      query: innerQuery || restQuery,
    },
  })
}

// /registrationRule/info 获取签到规则
export const getRegistrationRule = (ruleId: string) => {
  return http({
    url: `/registrationRule/info?ruleId=${ruleId}`,
    method: 'GET',
  })
}

// /demo/registrationActivity/showSignCode
// 获取签到二维码
export const getSignCode = (activityId: string) => {
  return http({
    url: `/registrationActivity/showSignCode?activityId=${activityId}`,
    method: 'GET',
  })
}

// /demo/registrationActivity/signIn 签到 activityId * signCode *
export const signIn = (activityId: string, signCode: string) => {
  return http({
    url: `/registrationActivity/signIn?activityId=${encodeURIComponent(
      activityId,
    )}&signCode=${encodeURIComponent(signCode)}`,
    method: 'GET',
  })
}

// /demo/registrationActivity/my 查询当前用户在活动中的签到状态
export const getMySignIn = (activityId: string) => {
  return http({
    url: `/registrationActivity/my?activityId=${encodeURIComponent(activityId)}`,
    method: 'GET',
  })
}

// /demo/commentActivity/deleteCommentActivity 删除评论 commentId
export const deleteCommentActivity = (commentId: string) => {
  return http({
    url: `/commentActivity/deleteCommentActivity?commentId=${commentId}`,
    method: 'GET',
  })
}

// /demo/commentActivity/listCommentActivity 获取用户评论活动列表 post
export const getCommentList = (data: SysActivityPageParams & Record<string, any>) => {
  const { pageNum, pageSize, order, orderBy, query: innerQuery, ...restQuery } = data
  return http({
    url: `/commentActivity/listCommentActivity`,
    method: 'POST',
    data: {
      pageNum,
      pageSize,
      order,
      orderBy,
      query: innerQuery || restQuery,
    },
  })
}

// /demo/commentActivity/saveCommentActivity 添加评论 post
export const addCommentActivity = (params: any) => {
  return http({
    url: `/commentActivity/saveCommentActivity`,
    method: 'POST',
    data: params,
  })
}

// 文件预览 /demo/attachment/download  fileName  get
export const downloadAttachment = (fileName: string) => {
  return http<any>({
    url: `/attachment/download?fileName=${encodeURIComponent(fileName)}`,
    method: 'GET',
    responseType: 'arraybuffer',
  })
}
