export type IdeaSignup = {
  id: string
  name: string
  userId?: string
  note?: string
  createdAt: string
}

export type Idea = {
  id: string
  title: string
  description: string
  budget: string
  peopleNeeded: number
  authorName: string
  authorUserId?: string
  signups: IdeaSignup[]
  createdAt: string
  updatedAt: string
}

export type ForumReply = {
  id: string
  authorName: string
  authorUserId?: string
  body: string
  imageDataUrl?: string
  createdAt: string
}

export type ForumPost = {
  id: string
  title: string
  body: string
  images: string[]
  authorName: string
  authorUserId?: string
  replies: ForumReply[]
  createdAt: string
  updatedAt: string
}

export type SessionUser = {
  id: string
  nickname: string
  realName: string
}

export type ProgressLog = {
  id: string
  at: string
  note: string
}

export type OngoingProject = {
  id: string
  name: string
  lead: string
  team: string
  currentSummary: string
  feishuUrl?: string
  progressLogs: ProgressLog[]
  createdAt: string
  updatedAt: string
}

export type Announcement = {
  id: string
  title: string
  body: string
  createdAt: string
}

export type AppState = {
  ideas: Idea[]
  announcements: Announcement[]
  ongoingProjects: OngoingProject[]
  forumPosts: ForumPost[]
}
