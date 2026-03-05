import { useEffect, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

type DiagramId = 'system' | 'backend' | 'worker' | 'frontendState' | 'userFlow'

interface DiagramConfig {
  id: DiagramId
  label: string
  description: string
}

const DIAGRAMS: DiagramConfig[] = [
  {
    id: 'system',
    label: 'System Overview',
    description: 'ภาพรวมการเชื่อมต่อระหว่าง Frontend, Backend, Database, Redis Queue, Worker และ OpenRouter',
  },
  {
    id: 'backend',
    label: 'Backend Architecture',
    description: 'เลเยอร์ของ Backend: Entry → Routes → Middleware → Controllers → Lib/Prisma/BullMQ',
  },
  {
    id: 'worker',
    label: 'Judge Worker Flow',
    description: 'การไหลของงานตั้งแต่ผู้ใช้ Submit โค้ด จนถึง Worker judge และสร้าง AI feedback',
  },
  {
    id: 'frontendState',
    label: 'Frontend State Management',
    description: 'ความสัมพันธ์ระหว่าง Auth Store (Zustand), LoadingContext และ Pages/Services',
  },
  {
    id: 'userFlow',
    label: 'User Flow',
    description: 'ลำดับจังหวะการใช้งานตั้งแต่ Login → เลือกโจทย์ → Run/Submit → ดู Analytics & AI Insights',
  },
]

const LABEL_BG_STYLE = {
  fill: 'rgba(15,23,42,0.96)',
  stroke: '#475569',
  rx: 4,
  ry: 4,
}

const STORAGE_PREFIX = 'insightcode-diagram-'

function loadDiagramState(id: DiagramId): { nodes: Node[]; edges: Edge[] } | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${id}`)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { nodes: Node[]; edges: Edge[] }
    if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

function saveDiagramState(id: DiagramId, nodes: Node[], edges: Edge[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    `${STORAGE_PREFIX}${id}`,
    JSON.stringify({ nodes, edges }),
  )
}

function getSystemOverviewDiagram(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
      {
        id: 'frontend',
        position: { x: 0, y: 0 },
        data: { label: 'Frontend SPA\n(React + Vite)' },
        style: {
          padding: 12,
          borderRadius: 12,
          border: '1px solid #334155',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 12,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'backend',
        position: { x: 260, y: 0 },
        data: { label: 'Backend API\n(Express + Prisma)' },
        style: {
          padding: 12,
          borderRadius: 12,
          border: '1px solid #4b5563',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 12,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'postgres',
        position: { x: 520, y: -60 },
        data: { label: 'PostgreSQL\n(Problems, Users,\nSubmissions, AiFeedback)' },
        style: {
          padding: 12,
          borderRadius: 12,
          border: '1px solid #0369a1',
          background: '#0b1120',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'redis',
        position: { x: 520, y: 80 },
        data: { label: 'Redis\n(BullMQ Queue\nsubmission-judge)' },
        style: {
          padding: 12,
          borderRadius: 12,
          border: '1px solid #b91c1c',
          background: '#111827',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'worker',
        position: { x: 780, y: 80 },
        data: { label: 'Worker Process\n(Node + BullMQ Worker)' },
        style: {
          padding: 12,
          borderRadius: 12,
          border: '1px solid #4b5563',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'openrouter',
        position: { x: 520, y: -220 },
        data: { label: 'OpenRouter API\n(LLM สำหรับ Chat & Analysis)' },
        style: {
          padding: 12,
          borderRadius: 12,
          border: '1px solid #7c3aed',
          background: '#111827',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
    ]

  const edges: Edge[] = [
      {
        id: 'frontend-backend',
        source: 'frontend',
        target: 'backend',
        label: 'HTTP / REST\n(React services)',
        animated: true,
        type: 'straight',
        style: { stroke: '#60a5fa' },
        labelStyle: { fill: '#e5e7eb', fontSize: 10 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'backend-postgres',
        source: 'backend',
        target: 'postgres',
        label: 'Prisma ORM',
        type: 'smoothstep',
        style: { stroke: '#38bdf8' },
        labelStyle: { fill: '#e5e7eb', fontSize: 10 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'backend-redis',
        source: 'backend',
        target: 'redis',
        label: 'BullMQ Queue\n(submission-judge)',
        type: 'smoothstep',
        style: { stroke: '#f97316' },
        labelStyle: { fill: '#e5e7eb', fontSize: 10 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'redis-worker',
        source: 'redis',
        target: 'worker',
        label: 'Jobs: { submissionId }',
        type: 'smoothstep',
        style: { stroke: '#f97316' },
        labelStyle: { fill: '#e5e7eb', fontSize: 10 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'worker-backend-internal',
        source: 'worker',
        target: 'backend',
        label: 'POST /api/submissions/internal/judge',
        type: 'smoothstep',
        style: { stroke: '#22c55e' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'backend-openrouter',
        source: 'backend',
        target: 'openrouter',
        label: 'openRouterChat()\n(chat, analysis)',
        type: 'smoothstep',
        style: { stroke: '#a855f7' },
        labelStyle: { fill: '#e5e7eb', fontSize: 10 },
        labelBgStyle: LABEL_BG_STYLE,
      },
    ]

  return { nodes, edges }
}

function getDiagramById(id: DiagramId): { nodes: Node[]; edges: Edge[] } {
  if (id === 'system') return getSystemOverviewDiagram()
  if (id === 'backend') return getBackendDiagram()
  if (id === 'worker') return getWorkerDiagram()
  if (id === 'frontendState') return getFrontendStateDiagram()
  return getUserFlowDiagram()
}

function getBackendDiagram(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
      {
        id: 'entry',
        position: { x: 0, y: 0 },
        data: { label: 'index.ts\n(Express App Entry)' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #4b5563',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'routes',
        position: { x: 220, y: -80 },
        data: { label: 'Routes\n/auth, /users, /problems,\n/submissions, /admin' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #374151',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'middleware',
        position: { x: 220, y: 80 },
        data: { label: 'Middleware\n(authenticate, authorize,\nlogging, cors, helmet)' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #374151',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'controllers',
        position: { x: 480, y: 0 },
        data: { label: 'Controllers\n(auth, users, problems,\nsubmissions, admin,\nannouncements, chat)' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #4b5563',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'lib',
        position: { x: 740, y: -80 },
        data: { label: 'Libs\nprisma.ts, jwt.ts,\nopenrouter.ts, logger.ts,\nlogBuffer.ts' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #0ea5e9',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'queue',
        position: { x: 740, y: 80 },
        data: { label: 'Queue\njudgeQueue (BullMQ)' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #f97316',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
    ]

  const edges: Edge[] = [
      { id: 'e-entry-routes', source: 'entry', target: 'routes', type: 'smoothstep', animated: true },
      { id: 'e-entry-mw', source: 'entry', target: 'middleware', type: 'smoothstep', animated: true },
      {
        id: 'e-routes-controllers',
        source: 'routes',
        target: 'controllers',
        type: 'smoothstep',
        label: 'map to controller handlers',
        style: { stroke: '#60a5fa' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'e-mw-controllers',
        source: 'middleware',
        target: 'controllers',
        type: 'smoothstep',
        label: 'authenticate/authorize',
        style: { stroke: '#f97316' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'e-controllers-lib',
        source: 'controllers',
        target: 'lib',
        type: 'smoothstep',
        label: 'DB + JWT + OpenRouter',
        style: { stroke: '#22c55e' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'e-controllers-queue',
        source: 'controllers',
        target: 'queue',
        type: 'smoothstep',
        label: 'createSubmission → judgeQueue.add',
        style: { stroke: '#f97316' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
    ]

  return { nodes, edges }
}

function getWorkerDiagram(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
      {
        id: 'user',
        position: { x: 0, y: 0 },
        data: { label: 'User\n(Workspace Page)' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #4b5563',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'frontend',
        position: { x: 220, y: 0 },
        data: { label: 'Frontend\nsubmissionApi.submit()' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #4b5563',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'backend-submission',
        position: { x: 480, y: 0 },
        data: { label: 'Backend\ncreateSubmission()' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #4b5563',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'queue',
        position: { x: 740, y: 0 },
        data: { label: 'BullMQ Queue\nsubmission-judge' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #f97316',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'worker',
        position: { x: 1000, y: 0 },
        data: { label: 'Worker\nindex.mjs' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #4b5563',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'backend-judge',
        position: { x: 1260, y: 0 },
        data: { label: 'Backend\ninternalJudgeSubmission()' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #22c55e',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
    ]

  const edges: Edge[] = [
      {
        id: 'e-user-frontend',
        source: 'user',
        target: 'frontend',
        type: 'smoothstep',
        label: 'click Submit',
        animated: true,
        style: { stroke: '#60a5fa' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'e-frontend-backend',
        source: 'frontend',
        target: 'backend-submission',
        type: 'smoothstep',
        label: 'POST /api/submissions',
        animated: true,
        style: { stroke: '#60a5fa' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'e-backend-queue',
        source: 'backend-submission',
        target: 'queue',
        type: 'smoothstep',
        label: 'judgeQueue.add("judge", { submissionId })',
        style: { stroke: '#f97316' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'e-queue-worker',
        source: 'queue',
        target: 'worker',
        type: 'smoothstep',
        label: 'Worker("submission-judge")',
        style: { stroke: '#f97316' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'e-worker-backend',
        source: 'worker',
        target: 'backend-judge',
        type: 'smoothstep',
        label: 'POST /api/submissions/internal/judge',
        style: { stroke: '#22c55e' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
    ]

  return { nodes, edges }
}

function getFrontendStateDiagram(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
      {
        id: 'authStore',
        position: { x: 0, y: 0 },
        data: { label: 'authStore (Zustand)\nuser, accessToken,\nisAuthenticated, isLoading' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #22c55e',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'useAuth',
        position: { x: 260, y: 0 },
        data: { label: 'hook useAuth()\nlogin, register,\nadminLogin, logout,\nsilentRefresh' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #4b5563',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'authApi',
        position: { x: 520, y: 0 },
        data: { label: 'authApi\n/login, /register,\n/admin-login, /refresh,\n/me, /logout' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #3b82f6',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'app',
        position: { x: 0, y: 160 },
        data: { label: 'App.tsx\nRoutes + RequireAuth/\nRequireAdmin + silent refresh' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #4b5563',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'loadingContext',
        position: { x: 260, y: 160 },
        data: { label: 'LoadingContext\nloading, setLoading\n(global page loading)' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #facc15',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'pages',
        position: { x: 520, y: 160 },
        data: { label: 'Pages\nAuth, Problems,\nWorkspace, Analytics,\nAdmin*' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #4b5563',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
    ]

  const edges: Edge[] = [
      {
        id: 'e-useAuth-authApi',
        source: 'useAuth',
        target: 'authApi',
        type: 'smoothstep',
        label: 'call HTTP',
        style: { stroke: '#3b82f6' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'e-useAuth-authStore',
        source: 'useAuth',
        target: 'authStore',
        type: 'smoothstep',
        label: 'setAuth / clearAuth',
        style: { stroke: '#22c55e' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'e-app-authStore',
        source: 'authStore',
        target: 'app',
        type: 'smoothstep',
        label: 'isAuthenticated, user, isLoading',
        style: { stroke: '#22c55e' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'e-loading-pages',
        source: 'loadingContext',
        target: 'pages',
        type: 'smoothstep',
        label: 'useLoading()',
        style: { stroke: '#facc15' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'e-app-loading',
        source: 'app',
        target: 'loadingContext',
        type: 'smoothstep',
        label: 'setPageLoading()',
        style: { stroke: '#facc15' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'e-pages-authStore',
        source: 'authStore',
        target: 'pages',
        type: 'smoothstep',
        label: 'useAuthStore()',
        style: { stroke: '#22c55e' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
    ]

  return { nodes, edges }
}

function getUserFlowDiagram(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
      {
        id: 'auth',
        position: { x: 0, y: 0 },
        data: { label: 'AuthPage\nLogin/Register' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #4b5563',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'problems',
        position: { x: 220, y: 0 },
        data: { label: 'ProblemExplorerPage\n/ GET /api/problems' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #4b5563',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'workspace',
        position: { x: 440, y: 0 },
        data: { label: 'ProblemWorkspacePage\n/ GET /api/problems/:id\n/ POST /api/submissions/run\n/ POST /api/submissions' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #4b5563',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'analytics',
        position: { x: 660, y: 0 },
        data: { label: 'AiAnalyticsPage\n/ GET /api/users/me/progress\n/ GET /api/users/me/insights' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #4b5563',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
      {
        id: 'chat',
        position: { x: 440, y: 160 },
        data: { label: 'ChatBubble\n/ POST /api/users/me/chat\n(OpenRouter LLM)' },
        style: {
          padding: 10,
          borderRadius: 10,
          border: '1px solid #7c3aed',
          background: '#020617',
          color: '#e5e7eb',
          fontSize: 11,
          textAlign: 'center',
          whiteSpace: 'pre-line',
        },
      },
    ]

  const edges: Edge[] = [
      {
        id: 'e-auth-problems',
        source: 'auth',
        target: 'problems',
        type: 'smoothstep',
        label: 'navigate("/problems")',
        animated: true,
        style: { stroke: '#60a5fa' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'e-problems-workspace',
        source: 'problems',
        target: 'workspace',
        type: 'smoothstep',
        label: 'open /workspace/:id',
        animated: true,
        style: { stroke: '#60a5fa' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'e-workspace-analytics',
        source: 'workspace',
        target: 'analytics',
        type: 'smoothstep',
        label: 'go to /analyze',
        style: { stroke: '#60a5fa' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
      {
        id: 'e-workspace-chat',
        source: 'workspace',
        target: 'chat',
        type: 'smoothstep',
        label: 'open AI chat with context',
        style: { stroke: '#7c3aed' },
        labelStyle: { fill: '#e5e7eb', fontSize: 9 },
        labelBgStyle: LABEL_BG_STYLE,
      },
    ]

  return { nodes, edges }
}

export default function SystemDiagramsPage() {
  const [activeDiagram, setActiveDiagram] = useState<DiagramId>('system')
  const [locked, setLocked] = useState(false)

  const initial = getDiagramById('system')
  const [nodes, setNodes] = useState<Node[]>(initial.nodes)
  const [edges, setEdges] = useState<Edge[]>(initial.edges)

  useEffect(() => {
    const stored = loadDiagramState(activeDiagram)
    const { nodes: nextNodes, edges: nextEdges } = stored ?? getDiagramById(activeDiagram)
    setNodes(nextNodes)
    setEdges(nextEdges)
  }, [activeDiagram])

  const onNodesChange = (changes: NodeChange[]) => {
    if (locked) return
    setNodes((nds) => applyNodeChanges(changes, nds))
  }

  const onEdgesChange = (changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds))
  }

  // Persist latest layout per diagram (รวมทั้งตอนก่อน/หลังล็อก)
  useEffect(() => {
    saveDiagramState(activeDiagram, nodes, edges)
  }, [activeDiagram, nodes, edges])

  const currentConfig = DIAGRAMS.find((d) => d.id === activeDiagram)!

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between bg-[#050816]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#5586e7]">schema</span>
          <span className="text-sm font-semibold">InsightCode System Diagrams</span>
        </div>
        <span className="text-xs text-slate-400">React Flow · Read-only diagrams</span>
      </header>

      <main className="flex-1 flex flex-col gap-4 p-4 md:p-6">
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-bold">{currentConfig.label}</h1>
              <p className="text-xs md:text-sm text-slate-400 max-w-2xl">
                {currentConfig.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLocked((v) => !v)}
                className={`px-2.5 py-1.5 rounded-full text-[11px] border flex items-center gap-1 ${
                  locked
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200'
                    : 'bg-slate-900/60 border-slate-600 text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {locked ? 'lock' : 'lock_open'}
                </span>
                {locked ? 'Locked' : 'Drag to rearrange'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {DIAGRAMS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setActiveDiagram(d.id)}
                className={`px-3 py-1.5 rounded-full text-xs md:text-sm border transition-all ${
                  activeDiagram === d.id
                    ? 'bg-[#5586e7] border-[#5586e7] text-white shadow-sm'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>

        {/* Local styles to theme React Flow controls */}
        <style>
          {`
            .react-flow__controls {
              background-color: rgba(15,23,42,0.96) !important;
              border: 1px solid #1f2937 !important;
              box-shadow: 0 4px 10px rgba(0,0,0,0.4);
            }
            .react-flow__controls button {
              background-color: transparent !important;
              border: 1px solid #374151 !important;
              color: #e5e7eb !important;
            }
            .react-flow__controls button:hover {
              background-color: #111827 !important;
            }
          `}
        </style>

        <section className="w-full h-[600px] rounded-xl border border-slate-800 bg-[#020617] overflow-hidden">
          <div className="w-full h-full">
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                style={{ width: '100%', height: '100%', background: '#020617' }}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                nodesDraggable={!locked}
                nodesConnectable={false}
                elementsSelectable={!locked}
                selectionOnDrag={!locked}
                zoomOnScroll
                zoomOnPinch
                panOnScroll
                panOnDrag={[2]}
              >
                <Background gap={16} color="#1f2937" />
                <MiniMap
                  nodeColor={() => '#1d4ed8'}
                  nodeStrokeColor="#e5e7eb"
                  maskColor="rgba(15,23,42,0.9)"
                  className="!bg-slate-950/90 !border-slate-800"
                />
                <Controls
                  showInteractive={false}
                  className="!bg-slate-900/90 !border-slate-700 !text-slate-100"
                />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </section>
      </main>
    </div>
  )
}

