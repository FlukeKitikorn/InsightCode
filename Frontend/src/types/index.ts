// ─── Auth ────────────────────────────────────────────────────
export type AuthMode = 'login' | 'register'

// ─── Problem ─────────────────────────────────────────────────
export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type ProblemStatus = 'solved' | 'attempted' | 'unsolved'

export interface ProblemTag {
  label: string
}

export interface Problem {
  id: number
  title: string
  difficulty: Difficulty
  status: ProblemStatus
  tags: ProblemTag[]
  acceptance: string
  aiRecommend?: string
  aiRecommendType?: 'interview' | 'top' | 'weak' | 'none'
}

export interface Contest {
  id: number
  title: string
  month: string
  day: number
  time: string
  duration: string
}

// ─── AI Analytics ────────────────────────────────────────────
export type MentalState = 'Flow' | 'Stressed' | 'Relaxed' | 'Anxious'

export interface StatCard {
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  icon: string
  accent?: boolean
}

export interface ActivityItem {
  id: number
  icon: string
  iconBg: string
  iconColor: string
  title: string
  description: string
  state: string
  time: string
}

export interface FunctionTime {
  name: string
  minutes: number
  color: string
  max: number
}

// ─── Admin ───────────────────────────────────────────────────
export type UserRole = 'Developer' | 'Admin' | 'Lead Dev'
export type UserStatus = 'Active' | 'Suspended'

export interface AdminUser {
  id: string
  initials: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  lastActive: string
}

export interface AiInsight {
  id: number
  icon: string
  bgColor: string
  iconColor: string
  title: string
  description: string
  badge: string
  badgeColor: string
}

export interface SystemResource {
  label: string
  percent: number
  color: string
}

// ─── Navigation (main app only) ──────────────────────────────
export type Page = 'auth' | 'problems' | 'workspace' | 'analytics'
