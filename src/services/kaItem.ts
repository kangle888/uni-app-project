import { http } from '@/utils/http'

export const getKaListAPI = (data: any) => {
  return http({
    method: 'POST',
    url: '/project/selectKAProject',
    data,
  })
}

export const getSaleProjectAPI = (data: any) => {
  return http({
    method: 'POST',
    url: '/project/selectSaleProject',
    data,
  })
}
