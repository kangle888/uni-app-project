import { http } from '@/utils/http'

export interface UpdateProfilePayload {
  nickname?: string
  avatar_url?: string
  username?: string
  phone?: string
}

export const updateProfile = (data: UpdateProfilePayload) => {
  return http({
    url: '/user/profile',
    method: 'POST',
    data,
  })
}
