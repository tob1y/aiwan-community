import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-change-me-in-production'
const PORT = Number(process.env.PORT) || 8787
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

function nicknameKey(nickname: string): string {
  return nickname.trim().toLowerCase()
}

type JwtPayload = { sub: string }

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' })
}

function tryParseJsonArray(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[]
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v)
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  }
  return []
}

function jsonArr(v: unknown): string {
  return JSON.stringify(Array.isArray(v) ? v : [])
}

function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

async function buildState() {
  const [ideas, announcements, ongoingProjects, forumPosts, pastActivities] = await Promise.all([
    prisma.idea.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { signups: { orderBy: { createdAt: 'asc' } } },
    }),
    prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.ongoingProject.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { progressLogs: { orderBy: { at: 'asc' } } },
    }),
    prisma.forumPost.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    }),
    prisma.pastActivity.findMany({ orderBy: { createdAt: 'desc' } }),
  ])

  return {
    ideas: ideas.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      budget: i.budget,
      peopleNeeded: i.peopleNeeded,
      authorName: i.authorName,
      authorUserId: i.authorUserId,
      signups: i.signups.map((s) => ({
        id: s.id,
        name: s.name,
        userId: s.userId ?? undefined,
        note: s.note ?? undefined,
        createdAt: s.createdAt.toISOString(),
      })),
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    })),
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      createdAt: a.createdAt.toISOString(),
    })),
    ongoingProjects: ongoingProjects.map((p) => ({
      id: p.id,
      name: p.name,
      lead: p.lead,
      team: p.team,
      currentSummary: p.currentSummary,
      feishuUrl: p.feishuUrl ?? undefined,
      progressLogs: p.progressLogs.map((l) => ({
        id: l.id,
        at: l.at.toISOString(),
        note: l.note,
      })),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    forumPosts: forumPosts.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      images: tryParseJsonArray(p.images),
      authorName: p.authorName,
      authorUserId: p.authorUserId,
      replies: p.replies.map((r) => ({
        id: r.id,
        authorName: r.authorName,
        authorUserId: r.authorUserId,
        body: r.body,
        imageDataUrl: r.imageDataUrl ?? undefined,
        createdAt: r.createdAt.toISOString(),
      })),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    pastActivities: pastActivities.map((a) => ({
      id: a.id,
      title: a.title,
      summary: a.summary,
      coverImage: a.coverImage ?? undefined,
      date: a.date,
      tag: a.tag,
      body: a.body,
      images: tryParseJsonArray(a.images),
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  }
}

async function main() {
  const app = Fastify({ logger: true })
  await app.register(cors, { origin: FRONTEND_ORIGIN, credentials: true })

  app.get('/api/health', async () => ({ ok: true }))

  app.get('/api/state', async () => buildState())

  app.post<{ Body: { nickname?: string; realName?: string; password?: string } }>(
    '/api/auth/register',
    async (req, reply) => {
      const nickname = (req.body.nickname || '').trim()
      const realName = (req.body.realName || '').trim()
      const password = req.body.password || ''
      if (!nickname || nickname.length > 24) {
        return reply.status(400).send({ error: '昵称请填写，且不超过 24 字。' })
      }
      if (!realName || realName.length > 40) {
        return reply.status(400).send({ error: '姓名请填写，且不超过 40 字。' })
      }
      if (password.length < 6) {
        return reply.status(400).send({ error: '密码至少 6 位。' })
      }
      const key = nicknameKey(nickname)
      const exists = await prisma.user.findUnique({ where: { nicknameKey: key } })
      if (exists) {
        return reply.status(400).send({ error: '该昵称已被注册，请换一个。' })
      }
      const passwordHash = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({
        data: {
          nickname,
          nicknameKey: key,
          realName,
          passwordHash,
        },
      })
      const token = signToken(user.id)
      return {
        token,
        user: { id: user.id, nickname: user.nickname, realName: user.realName },
      }
    },
  )

  app.post<{ Body: { nickname?: string; password?: string } }>(
    '/api/auth/login',
    async (req, reply) => {
      const nickname = (req.body.nickname || '').trim()
      const password = req.body.password || ''
      const key = nicknameKey(nickname)
      const user = await prisma.user.findUnique({ where: { nicknameKey: key } })
      if (!user) {
        return reply.status(401).send({ error: '昵称或密码不正确。' })
      }
      const ok = await bcrypt.compare(password, user.passwordHash)
      if (!ok) {
        return reply.status(401).send({ error: '昵称或密码不正确。' })
      }
      const token = signToken(user.id)
      return {
        token,
        user: { id: user.id, nickname: user.nickname, realName: user.realName },
      }
    },
  )

  app.get('/api/auth/me', async (req, reply) => {
    const auth = req.headers.authorization
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) {
      return reply.status(401).send({ error: '未登录' })
    }
    const payload = verifyToken(token)
    if (!payload?.sub) {
      return reply.status(401).send({ error: '无效令牌' })
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) {
      return reply.status(401).send({ error: '用户不存在' })
    }
    return { user: { id: user.id, nickname: user.nickname, realName: user.realName } }
  })

  function authUserId(req: { headers: { authorization?: string } }): string | null {
    const auth = req.headers.authorization
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return null
    const payload = verifyToken(token)
    return payload?.sub ?? null
  }

  app.post<{ Body: { title?: string; description?: string; budget?: string; peopleNeeded?: number } }>(
    '/api/ideas',
    async (req, reply) => {
      const uid = authUserId(req)
      if (!uid) return reply.status(401).send({ error: '请先登录' })
      const user = await prisma.user.findUnique({ where: { id: uid } })
      if (!user) return reply.status(401).send({ error: '用户不存在' })
      const title = (req.body.title || '').trim()
      const description = (req.body.description || '').trim()
      const budget = (req.body.budget || '').trim()
      const peopleNeeded = Number(req.body.peopleNeeded) || 1
      if (!title || !description || !budget) {
        return reply.status(400).send({ error: '请填写标题、说明与预算。' })
      }
      const idea = await prisma.idea.create({
        data: {
          title,
          description,
          budget,
          peopleNeeded: Math.max(1, peopleNeeded),
          authorName: user.nickname,
          authorUserId: user.id,
        },
      })
      const state = await buildState()
      return { id: idea.id, state }
    },
  )

  app.patch<{
    Params: { id: string }
    Body: { title?: string; description?: string; budget?: string; peopleNeeded?: number }
  }>('/api/ideas/:id', async (req, reply) => {
    const uid = authUserId(req)
    if (!uid) return reply.status(401).send({ error: '请先登录' })
    const idea = await prisma.idea.findUnique({ where: { id: req.params.id } })
    if (!idea || idea.authorUserId !== uid) {
      return reply.status(403).send({ error: '无权编辑' })
    }
    const data: Record<string, unknown> = {}
    if (req.body.title !== undefined) data.title = String(req.body.title).trim()
    if (req.body.description !== undefined) data.description = String(req.body.description).trim()
    if (req.body.budget !== undefined) data.budget = String(req.body.budget).trim()
    if (req.body.peopleNeeded !== undefined) {
      data.peopleNeeded = Math.max(1, Number(req.body.peopleNeeded) || 1)
    }
    await prisma.idea.update({ where: { id: idea.id }, data })
    return { state: await buildState() }
  })

  app.delete<{ Params: { id: string } }>('/api/ideas/:id', async (req, reply) => {
    const uid = authUserId(req)
    if (!uid) return reply.status(401).send({ error: '请先登录' })
    const idea = await prisma.idea.findUnique({ where: { id: req.params.id } })
    if (!idea || idea.authorUserId !== uid) {
      return reply.status(403).send({ error: '无权删除' })
    }
    await prisma.idea.delete({ where: { id: idea.id } })
    return { state: await buildState() }
  })

  app.post<{ Params: { id: string }; Body: { note?: string } }>(
    '/api/ideas/:id/signups',
    async (req, reply) => {
      const uid = authUserId(req)
      if (!uid) return reply.status(401).send({ error: '请先登录' })
      const user = await prisma.user.findUnique({ where: { id: uid } })
      if (!user) return reply.status(401).send({ error: '用户不存在' })
      const idea = await prisma.idea.findUnique({
        where: { id: req.params.id },
        include: { signups: true },
      })
      if (!idea) return reply.status(404).send({ error: '创意不存在' })
      if (idea.signups.some((s) => s.userId === uid)) {
        return reply.status(400).send({ error: '你已经报过名了。' })
      }
      const note = (req.body.note || '').trim() || null
      await prisma.ideaSignup.create({
        data: {
          ideaId: idea.id,
          name: user.nickname,
          userId: user.id,
          note,
        },
      })
      return { state: await buildState() }
    },
  )

  app.post<{ Body: { title?: string; body?: string; images?: unknown } }>(
    '/api/forum/posts',
    async (req, reply) => {
      const uid = authUserId(req)
      if (!uid) return reply.status(401).send({ error: '请先登录' })
      const user = await prisma.user.findUnique({ where: { id: uid } })
      if (!user) return reply.status(401).send({ error: '用户不存在' })
      const title = (req.body.title || '').trim()
      const body = (req.body.body || '').trim()
      const images = Array.isArray(req.body.images)
        ? (req.body.images as unknown[]).filter((x): x is string => typeof x === 'string')
        : []
      if (!title || !body) {
        return reply.status(400).send({ error: '请填写标题与正文。' })
      }
      const post = await prisma.forumPost.create({
        data: {
          title,
          body,
          images: jsonArr(images),
          authorName: user.nickname,
          authorUserId: user.id,
        },
      })
      return { id: post.id, state: await buildState() }
    },
  )

  app.post<{
    Params: { id: string }
    Body: { body?: string; imageDataUrl?: string | null }
  }>('/api/forum/posts/:id/replies', async (req, reply) => {
    const uid = authUserId(req)
    if (!uid) return reply.status(401).send({ error: '请先登录' })
    const user = await prisma.user.findUnique({ where: { id: uid } })
    if (!user) return reply.status(401).send({ error: '用户不存在' })
    const body = (req.body.body || '').trim()
    if (!body) return reply.status(400).send({ error: '请填写回复内容。' })
    const post = await prisma.forumPost.findUnique({ where: { id: req.params.id } })
    if (!post) return reply.status(404).send({ error: '帖子不存在' })
    const imageDataUrl =
      typeof req.body.imageDataUrl === 'string' && req.body.imageDataUrl.trim()
        ? req.body.imageDataUrl.trim()
        : null
    await prisma.forumReply.create({
      data: {
        postId: post.id,
        authorName: user.nickname,
        authorUserId: user.id,
        body,
        imageDataUrl,
      },
    })
    return { state: await buildState() }
  })

  app.delete<{ Params: { id: string } }>('/api/forum/posts/:id', async (req, reply) => {
    const uid = authUserId(req)
    if (!uid) return reply.status(401).send({ error: '请先登录' })
    const post = await prisma.forumPost.findUnique({ where: { id: req.params.id } })
    if (!post || post.authorUserId !== uid) {
      return reply.status(403).send({ error: '无权删除' })
    }
    await prisma.forumPost.delete({ where: { id: post.id } })
    return { state: await buildState() }
  })

  app.post<{ Body: { title?: string; body?: string } }>('/api/announcements', async (req, reply) => {
    if (!authUserId(req)) return reply.status(401).send({ error: '请先登录' })
    const title = (req.body.title || '').trim()
    const body = (req.body.body || '').trim()
    if (!title || !body) return reply.status(400).send({ error: '标题与正文必填' })
    await prisma.announcement.create({ data: { title, body } })
    return { state: await buildState() }
  })

  app.delete<{ Params: { id: string } }>('/api/announcements/:id', async (req, reply) => {
    if (!authUserId(req)) return reply.status(401).send({ error: '请先登录' })
    await prisma.announcement.deleteMany({ where: { id: req.params.id } })
    return { state: await buildState() }
  })

  app.post<{
    Body: { name?: string; lead?: string; team?: string; currentSummary?: string; feishuUrl?: string }
  }>('/api/ongoing', async (req, reply) => {
    if (!authUserId(req)) return reply.status(401).send({ error: '请先登录' })
    const name = (req.body.name || '').trim()
    const lead = (req.body.lead || '').trim()
    const team = (req.body.team || '').trim()
    const currentSummary = (req.body.currentSummary || '').trim()
    const feishuUrl = (req.body.feishuUrl || '').trim() || null
    if (!name || !lead || !currentSummary) {
      return reply.status(400).send({ error: '项目名称、负责人与进度摘要为必填' })
    }
    await prisma.ongoingProject.create({
      data: { name, lead, team, currentSummary, feishuUrl },
    })
    return { state: await buildState() }
  })

  app.patch<{ Params: { id: string }; Body: { summary?: string } }>(
    '/api/ongoing/:id/summary',
    async (req, reply) => {
      if (!authUserId(req)) return reply.status(401).send({ error: '请先登录' })
      const summary = (req.body.summary || '').trim()
      await prisma.ongoingProject.update({
        where: { id: req.params.id },
        data: { currentSummary: summary },
      })
      return { state: await buildState() }
    },
  )

  app.post<{ Params: { id: string }; Body: { note?: string } }>(
    '/api/ongoing/:id/logs',
    async (req, reply) => {
      if (!authUserId(req)) return reply.status(401).send({ error: '请先登录' })
      const note = (req.body.note || '').trim()
      if (!note) return reply.status(400).send({ error: '记录不能为空' })
      await prisma.progressLog.create({
        data: { projectId: req.params.id, note },
      })
      return { state: await buildState() }
    },
  )

  app.delete<{ Params: { id: string } }>('/api/ongoing/:id', async (req, reply) => {
    if (!authUserId(req)) return reply.status(401).send({ error: '请先登录' })
    await prisma.ongoingProject.deleteMany({ where: { id: req.params.id } })
    return { state: await buildState() }
  })

  // --- 往期项目 ---
  app.post<{
    Body: { title?: string; summary?: string; coverImage?: string; date?: string; tag?: string; body?: string; images?: unknown }
  }>('/api/past-activities', async (req, reply) => {
    if (!authUserId(req)) return reply.status(401).send({ error: '请先登录' })
    const title = (req.body.title || '').trim()
    const summary = (req.body.summary || '').trim()
    const date = (req.body.date || '').trim()
    const tag = (req.body.tag || '').trim()
    const body = (req.body.body || '').trim()
    if (!title || !summary || !date || !body) {
      return reply.status(400).send({ error: '标题、摘要、日期与正文为必填。' })
    }
    const coverImage = (req.body.coverImage || '').trim() || null
    const images = Array.isArray(req.body.images)
      ? (req.body.images as unknown[]).filter((x): x is string => typeof x === 'string')
      : []
    await prisma.pastActivity.create({
      data: { title, summary, coverImage, date, tag, body, images: jsonArr(images) },
    })
    return { state: await buildState() }
  })

  app.patch<{
    Params: { id: string }
    Body: { title?: string; summary?: string; coverImage?: string; date?: string; tag?: string; body?: string; images?: unknown }
  }>('/api/past-activities/:id', async (req, reply) => {
    if (!authUserId(req)) return reply.status(401).send({ error: '请先登录' })
    const data: Record<string, unknown> = {}
    if (req.body.title !== undefined) data.title = String(req.body.title).trim()
    if (req.body.summary !== undefined) data.summary = String(req.body.summary).trim()
    if (req.body.date !== undefined) data.date = String(req.body.date).trim()
    if (req.body.tag !== undefined) data.tag = String(req.body.tag).trim()
    if (req.body.body !== undefined) data.body = String(req.body.body).trim()
    if (req.body.coverImage !== undefined) data.coverImage = String(req.body.coverImage).trim() || null
    if (req.body.images !== undefined) {
      data.images = jsonArr(Array.isArray(req.body.images)
        ? (req.body.images as unknown[]).filter((x): x is string => typeof x === 'string')
        : [])
    }
    await prisma.pastActivity.update({ where: { id: req.params.id }, data })
    return { state: await buildState() }
  })

  app.delete<{ Params: { id: string } }>('/api/past-activities/:id', async (req, reply) => {
    if (!authUserId(req)) return reply.status(401).send({ error: '请先登录' })
    await prisma.pastActivity.deleteMany({ where: { id: req.params.id } })
    return { state: await buildState() }
  })

  await app.listen({ port: PORT, host: '0.0.0.0' })
  console.log(`API http://0.0.0.0:${PORT}  CORS ${FRONTEND_ORIGIN}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
