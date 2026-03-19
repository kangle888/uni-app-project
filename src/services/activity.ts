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
    url: `/sysActivity/viewActivity?id=${activityId}`,
    method: 'GET',
  })
}

// /sysActivity/viewActivity 活动信息统计  get
export const viewActivity = (activityId: string) => {
  return http({
    url: `/sysActivity/viewActivity?id=${activityId}`,
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
export const cancelActivity = (activityId: string) => {
  return http({
    url: `/enterActivity/cancel?activityId=${activityId}`,
    method: 'GET',
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
    url: `/registrationActivity/signIn?activityId=${activityId}&signCode=${signCode}`,
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
    url: `/commentActivity/addCommentActivity`,
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
