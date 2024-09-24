import { http } from '@/utils/http'
import {
  type SaleProjectItem,
  type KaProjectItem,
  type KaNumberItem,
} from '@/types/kaItems'

export const getKaListAPI = (data: any) => {
  return http<KaProjectItem[]>({
    method: 'POST',
    url: '/project/selectKAProject',
    data,
  })
}

export const getSaleProjectAPI = (data: any) => {
  return http<SaleProjectItem[]>({
    method: 'POST',
    url: '/project/selectSaleProject',
    data,
  })
}

export const getKaNumberAPI = () => {
  return http<KaNumberItem[]>({
    method: 'POST',
    url: '/project/selectKANumber',
  })
}
