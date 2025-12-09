import { http } from '@/utils/http'

/**
 * 房间通用类型
 */
export interface RoomSummary {
  id: string
  name: string
  invite_code: string
  creator_id: number
  member_id?: string
  status: number
  created_at: string
  updated_at: string
}

export interface RoomMember {
  id: string
  room_id: string
  user_id: number
  balance: string
  joined_at: string
  nickname?: string
  avatar_url?: string
}

export interface RoomTransaction {
  id: string
  room_id: string
  from_member_id: string
  to_member_id: string
  amount: string
  remark: string
  created_at: string
}

export interface RoomDetail {
  room: RoomSummary
  members: RoomMember[]
  transactions: RoomTransaction[]
}

export interface CreateRoomPayload {
  name: string
}

export interface JoinRoomPayload {
  inviteCode: string
}

export interface TransferPayload {
  fromMemberId: string
  toMemberId: string
  amount: number
  remark?: string
}

export const fetchRooms = () => {
  return http<RoomSummary[]>({
    url: '/rooms',
    method: 'GET',
  })
}

export const deleteRoom = (roomId: string) => {
  return http({
    url: `/rooms/${roomId}`,
    method: 'DELETE',
  })
}

export const leaveRoom = (roomId: string) => {
  return http({
    url: `/rooms/${roomId}/leave`,
    method: 'DELETE',
  })
}

export const createRoom = (data: CreateRoomPayload) => {
  return http<RoomDetail>({
    url: '/rooms',
    method: 'POST',
    data,
  })
}

export const joinRoom = (data: JoinRoomPayload) => {
  return http<RoomMember>({
    url: '/rooms/join',
    method: 'POST',
    data,
  })
}

export const fetchRoomDetail = (roomId: string) => {
  return http<RoomDetail>({
    url: `/rooms/${roomId}`,
    method: 'GET',
  })
}

export const createTransfer = (roomId: string, data: TransferPayload) => {
  return http<RoomTransaction>({
    url: `/rooms/${roomId}/transfer`,
    method: 'POST',
    data,
  })
}

export interface QRCodeResponse {
  qrCode: string // base64 格式的图片
  inviteCode: string
}

export const generateRoomQRCode = (data: { inviteCode: string }) => {
  return http<QRCodeResponse>({
    url: '/rooms/qr',
    method: 'POST',
    data,
  })
}
