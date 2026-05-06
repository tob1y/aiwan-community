import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  Announcement,
  AppState,
  ForumPost,
  Idea,
  OngoingProject,
} from '../types'
import { apiJson } from '../lib/api'
import { useAuth } from './AuthContext'

type CommunityContextValue = {
  ideas: Idea[]
  announcements: Announcement[]
  ongoingProjects: OngoingProject[]
  forumPosts: ForumPost[]
  communityLoading: boolean
  communityError: string | null
  clearCommunityError: () => void
  canEditIdea: (ideaId: string, userId: string | null) => boolean
  canEditForumPost: (postId: string, userId: string | null) => boolean
  addIdea: (input: Omit<Idea, 'id' | 'signups' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateIdea: (
    ideaId: string,
    userId: string | null,
    patch: Partial<Pick<Idea, 'title' | 'description' | 'budget' | 'peopleNeeded'>>,
  ) => Promise<void>
  removeIdea: (ideaId: string, userId: string | null) => Promise<void>
  addSignup: (ideaId: string, name: string, note: string | undefined, userId: string | undefined) => Promise<void>
  addForumPost: (input: Omit<ForumPost, 'id' | 'replies' | 'createdAt' | 'updatedAt'>) => Promise<string>
  addForumReply: (
    postId: string,
    authorName: string,
    body: string,
    imageDataUrl: string | undefined,
    authorUserId: string | undefined,
  ) => Promise<void>
  removeForumPost: (postId: string, userId: string | null) => Promise<void>
  addAnnouncement: (title: string, body: string) => Promise<void>
  removeAnnouncement: (id: string) => Promise<void>
  addOngoingProject: (input: {
    name: string
    lead: string
    team: string
    currentSummary: string
    feishuUrl?: string
  }) => Promise<void>
  updateOngoingSummary: (id: string, summary: string) => Promise<void>
  addProgressLog: (id: string, note: string) => Promise<void>
  removeOngoingProject: (id: string) => Promise<void>
}

const CommunityContext = createContext<CommunityContextValue | null>(null)

const empty: AppState = {
  ideas: [],
  announcements: [],
  ongoingProjects: [],
  forumPosts: [],
}

function canEditIdeaWithUser(ideas: Idea[], ideaId: string, userId: string | null): boolean {
  const idea = ideas.find((i) => i.id === ideaId)
  if (!idea || !userId) return false
  return idea.authorUserId === userId
}

function canEditForumWithUser(posts: ForumPost[], postId: string, userId: string | null): boolean {
  const post = posts.find((p) => p.id === postId)
  if (!post || !userId) return false
  return post.authorUserId === userId
}

export function CommunityProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [state, setState] = useState<AppState>(empty)
  const [communityLoading, setCommunityLoading] = useState(true)
  const [communityError, setCommunityError] = useState<string | null>(null)

  const clearCommunityError = useCallback(() => setCommunityError(null), [])

  const loadState = useCallback(async () => {
    setCommunityLoading(true)
    setCommunityError(null)
    try {
      const data = await apiJson<AppState>('/api/state')
      setState(data)
    } catch (e) {
      setCommunityError(e instanceof Error ? e.message : '加载社区数据失败（请确认已启动数据库与 API 服务）')
      setState(empty)
    } finally {
      setCommunityLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadState()
  }, [loadState, token])

  const canEditIdea = useCallback(
    (ideaId: string, userId: string | null) => canEditIdeaWithUser(state.ideas, ideaId, userId),
    [state.ideas],
  )

  const canEditForumPost = useCallback(
    (postId: string, userId: string | null) => canEditForumWithUser(state.forumPosts, postId, userId),
    [state.forumPosts],
  )

  const addIdea = useCallback(async (input: Omit<Idea, 'id' | 'signups' | 'createdAt' | 'updatedAt'>) => {
    const res = await apiJson<{ id: string; state: AppState }>('/api/ideas', {
      json: {
        title: input.title,
        description: input.description,
        budget: input.budget,
        peopleNeeded: input.peopleNeeded,
      },
    })
    setState(res.state)
    return res.id
  }, [])

  const updateIdea = useCallback(
    async (
      ideaId: string,
      _userId: string | null,
      patch: Partial<Pick<Idea, 'title' | 'description' | 'budget' | 'peopleNeeded'>>,
    ) => {
      const res = await apiJson<{ state: AppState }>(`/api/ideas/${encodeURIComponent(ideaId)}`, {
        method: 'PATCH',
        json: patch,
      })
      setState(res.state)
    },
    [],
  )

  const removeIdea = useCallback(async (ideaId: string, _userId: string | null) => {
    const res = await apiJson<{ state: AppState }>(`/api/ideas/${encodeURIComponent(ideaId)}`, {
      method: 'DELETE',
    })
    setState(res.state)
  }, [])

  const addSignup = useCallback(
    async (ideaId: string, _name: string, note: string | undefined, _userId: string | undefined) => {
      const res = await apiJson<{ state: AppState }>(
        `/api/ideas/${encodeURIComponent(ideaId)}/signups`,
        { json: { note: note ?? '' } },
      )
      setState(res.state)
    },
    [],
  )

  const addForumPost = useCallback(
    async (input: Omit<ForumPost, 'id' | 'replies' | 'createdAt' | 'updatedAt'>) => {
      const res = await apiJson<{ id: string; state: AppState }>('/api/forum/posts', {
        json: {
          title: input.title,
          body: input.body,
          images: input.images,
        },
      })
      setState(res.state)
      return res.id
    },
    [],
  )

  const addForumReply = useCallback(
    async (
      postId: string,
      _authorName: string,
      body: string,
      imageDataUrl: string | undefined,
      _authorUserId: string | undefined,
    ) => {
      const res = await apiJson<{ state: AppState }>(
        `/api/forum/posts/${encodeURIComponent(postId)}/replies`,
        { json: { body, imageDataUrl: imageDataUrl ?? null } },
      )
      setState(res.state)
    },
    [],
  )

  const removeForumPost = useCallback(async (postId: string, _userId: string | null) => {
    const res = await apiJson<{ state: AppState }>(`/api/forum/posts/${encodeURIComponent(postId)}`, {
      method: 'DELETE',
    })
    setState(res.state)
  }, [])

  const addAnnouncement = useCallback(async (title: string, body: string) => {
    const res = await apiJson<{ state: AppState }>('/api/announcements', {
      json: { title, body },
    })
    setState(res.state)
  }, [])

  const removeAnnouncement = useCallback(async (id: string) => {
    const res = await apiJson<{ state: AppState }>(`/api/announcements/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    setState(res.state)
  }, [])

  const addOngoingProject = useCallback(
    async (input: {
      name: string
      lead: string
      team: string
      currentSummary: string
      feishuUrl?: string
    }) => {
      const res = await apiJson<{ state: AppState }>('/api/ongoing', { json: input })
      setState(res.state)
    },
    [],
  )

  const updateOngoingSummary = useCallback(async (id: string, summary: string) => {
    const res = await apiJson<{ state: AppState }>(`/api/ongoing/${encodeURIComponent(id)}/summary`, {
      method: 'PATCH',
      json: { summary },
    })
    setState(res.state)
  }, [])

  const addProgressLog = useCallback(async (id: string, note: string) => {
    const res = await apiJson<{ state: AppState }>(`/api/ongoing/${encodeURIComponent(id)}/logs`, {
      json: { note },
    })
    setState(res.state)
  }, [])

  const removeOngoingProject = useCallback(async (id: string) => {
    const res = await apiJson<{ state: AppState }>(`/api/ongoing/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    setState(res.state)
  }, [])

  const value = useMemo<CommunityContextValue>(
    () => ({
      ideas: state.ideas,
      announcements: state.announcements,
      ongoingProjects: state.ongoingProjects,
      forumPosts: state.forumPosts,
      communityLoading,
      communityError,
      clearCommunityError,
      canEditIdea,
      canEditForumPost,
      addIdea,
      updateIdea,
      removeIdea,
      addSignup,
      addForumPost,
      addForumReply,
      removeForumPost,
      addAnnouncement,
      removeAnnouncement,
      addOngoingProject,
      updateOngoingSummary,
      addProgressLog,
      removeOngoingProject,
    }),
    [
      state.ideas,
      state.announcements,
      state.ongoingProjects,
      state.forumPosts,
      communityLoading,
      communityError,
      clearCommunityError,
      canEditIdea,
      canEditForumPost,
      addIdea,
      updateIdea,
      removeIdea,
      addSignup,
      addForumPost,
      addForumReply,
      removeForumPost,
      addAnnouncement,
      removeAnnouncement,
      addOngoingProject,
      updateOngoingSummary,
      addProgressLog,
      removeOngoingProject,
    ],
  )

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>
}

export function useCommunity(): CommunityContextValue {
  const ctx = useContext(CommunityContext)
  if (!ctx) throw new Error('useCommunity must be used within CommunityProvider')
  return ctx
}
