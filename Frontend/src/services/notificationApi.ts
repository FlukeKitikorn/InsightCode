export interface Announcement {
  id: number
  title: string
  body: string
  type: string
  createdAt: string
}

interface ListAnnouncementsResponse {
  announcements: Announcement[]
}

const API_BASE = 'http://localhost:4000/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong')
  }

  return data as T
}

async function requestWithAuth<T>(path: string, accessToken: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers as Record<string, string>),
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong')
  }

  return data as T
}

/** รายการประกาศที่ยังไม่อ่านของ user (ต้องส่ง token) */
export const notificationApi = {
  /** ดึงเฉพาะประกาศที่ user ยังไม่อ่าน */
  listAnnouncements: (accessToken: string | undefined) => {
    if (accessToken) {
      return requestWithAuth<ListAnnouncementsResponse>('/users/me/announcements', accessToken)
    }
    return request<ListAnnouncementsResponse>('/announcements')
  },

  /** บันทึกว่าอ่านทั้งหมดแล้ว (clear ออกจาก user นั้น) */
  markAllRead: (accessToken: string) =>
    requestWithAuth<{ message: string }>('/users/me/announcements/read', accessToken, {
      method: 'POST',
    }),
}

