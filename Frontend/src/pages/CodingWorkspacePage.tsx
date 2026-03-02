import { useState, useEffect, useRef } from 'react'
import type { Page } from '../types'
import * as monaco from 'monaco-editor'

const DEFAULT_CODE = `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Optimized with Hash Map
        prevMap = {}  # val : index
        for i, n in enumerate(nums):
            diff = target - n
            if diff in prevMap:
                return [prevMap[diff], i]
            prevMap[n] = i
        return []`

const LANGUAGES = ['Python 3', 'JavaScript', 'C++', 'Java', 'Go']

const BEHAVIORAL_HISTORY = [
    { color: 'bg-green-500', text: 'Optimal Data Structure Selected', time: '2 mins ago' },
    { color: 'bg-blue-500', text: 'Refactored loop for readability', time: '5 mins ago' },
    { color: 'bg-amber-500', text: 'Switched from brute force approach', time: '8 mins ago' },
]

interface CodingWorkspacePageProps {
    onNavigate: (page: Page) => void
}

export default function CodingWorkspacePage({ onNavigate }: CodingWorkspacePageProps) {
    const [lang, setLang] = useState('Python 3')
    const [showLangMenu, setShowLangMenu] = useState(false)
    const [activeTab, setActiveTab] = useState<'testcase' | 'result'>('testcase')
    const [activeCase, setActiveCase] = useState(1)
    const [isRunning, setIsRunning] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [leftPanel, setLeftPanel] = useState<'description' | 'hints'>('description')
    const langRef = useRef<HTMLDivElement>(null)
    const editorContainerRef = useRef<HTMLDivElement | null>(null)
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
    const [code, setCode] = useState(DEFAULT_CODE)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(e.target as Node)) {
                setShowLangMenu(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        if (!editorContainerRef.current || editorRef.current) return

        editorRef.current = monaco.editor.create(editorContainerRef.current, {
            value: code,
            language: 'python',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 13,
        })

        const sub = editorRef.current.onDidChangeModelContent(() => {
            setCode(editorRef.current!.getValue())
        })

        return () => {
            sub.dispose()
            editorRef.current?.dispose()
            editorRef.current = null
        }
    }, [])

    useEffect(() => {
        if (!editorRef.current) return
        const languageMap: Record<string, string> = {
            'Python 3': 'python',
            JavaScript: 'javascript',
            'C++': 'cpp',
            Java: 'java',
            Go: 'go',
        }
        const targetLang = languageMap[lang] ?? 'plaintext'
        const model = editorRef.current.getModel()
        if (model) {
            monaco.editor.setModelLanguage(model, targetLang)
        }
    }, [lang])

    const handleRun = () => {
        setIsRunning(true)
        setActiveTab('result')
        setTimeout(() => setIsRunning(false), 1500)
    }

    const handleSubmit = () => {
        setIsRunning(true)
        setActiveTab('result')
        setTimeout(() => { setIsRunning(false); setSubmitted(true) }, 2000)
    }

    return (
        <div className="flex flex-col bg-[#0b0e14] text-slate-100 h-screen">
                <div className="flex flex-col bg-[#0b0e14] text-slate-100 h-full">
                    {/* ── Top Bar ───────────────────────────────────────────── */}
                    <header className="h-12 flex items-center justify-between px-4 border-b border-slate-800 bg-[#050812]">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => onNavigate('problems')}
                                className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white"
                            >
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                                Back to Problems
                            </button>
                            <span className="w-px h-4 bg-slate-700" />
                            <p className="text-xs text-slate-400">
                                Workspace • Two Sum
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                Connected
                            </span>
                            <span className="hidden md:inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">bolt</span>
                                Latency: 42ms
                            </span>
                        </div>
                    </header>

                    {/* ── 3-Panel Workspace ─────────────────────────────────── */}
                    <div className="flex flex-1 overflow-hidden">

                        {/* Left Panel: Problem Details */}
                        <aside className="md:w-1/3 lg:w-[380px] hidden md:flex md:flex-col border-r border-[#e8ebf3] dark:border-[#2d3748] bg-white dark:bg-[#111621] shrink-0">
                            {/* Breadcrumbs */}
                            <div className="flex items-center gap-2 px-6 py-3 text-xs text-gray-500 font-medium border-b border-[#e8ebf3] dark:border-[#2d3748]">
                                <button onClick={() => onNavigate('problems')} className="hover:text-[#5586e7] transition-colors">Problems</button>
                                <span>/</span>
                                <span className="hover:text-[#5586e7] cursor-pointer transition-colors">Algorithms</span>
                                <span>/</span>
                                <span className="text-gray-900 dark:text-gray-200">1. Two Sum</span>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-[#e8ebf3] dark:border-[#2d3748]">
                                {(['description', 'hints'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setLeftPanel(tab)}
                                        className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${leftPanel === tab ? 'text-[#5586e7] border-b-2 border-[#5586e7]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold dark:text-white">1. Two Sum</h2>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Easy</span>
                                </div>
                                <div className="flex gap-2 mb-6">
                                    {['Array', 'Hash Table'].map((tag) => (
                                        <span key={tag} className="px-2 py-1 bg-[#5586e7]/10 text-[#5586e7] text-xs rounded-md font-medium">{tag}</span>
                                    ))}
                                </div>
                                <div className="text-gray-700 dark:text-gray-300 text-sm space-y-4 mb-6">
                                    <p>
                                        Given an array of integers{' '}
                                        <code className="bg-gray-100 dark:bg-gray-800 px-1.5 rounded font-mono">nums</code> and an integer{' '}
                                        <code className="bg-gray-100 dark:bg-gray-800 px-1.5 rounded font-mono">target</code>,
                                        return <strong>indices</strong> of the two numbers such that they add up to{' '}
                                        <code className="bg-gray-100 dark:bg-gray-800 px-1.5 rounded font-mono">target</code>.
                                    </p>
                                    <p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p>
                                </div>

                                {/* Examples */}
                                <div className="space-y-4 mb-6">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Example 1</p>
                                        <div className="font-mono text-sm space-y-1 dark:text-gray-300">
                                            <p><span className="text-gray-500">Input:</span> nums = [2,7,11,15], target = 9</p>
                                            <p><span className="text-gray-500">Output:</span> [0,1]</p>
                                            <p className="text-gray-500 text-xs italic">nums[0] + nums[1] == 9, return [0, 1]</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Example 2</p>
                                        <div className="font-mono text-sm space-y-1 dark:text-gray-300">
                                            <p><span className="text-gray-500">Input:</span> nums = [3,2,4], target = 6</p>
                                            <p><span className="text-gray-500">Output:</span> [1,2]</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Constraints */}
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Constraints</h3>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 font-mono">
                                        <li>2 {'<='} nums.length {'<='} 10⁴</li>
                                        <li>-10⁹ {'<='} nums[i] {'<='} 10⁹</li>
                                        <li className="font-semibold text-[#5586e7]/80 italic" style={{ fontFamily: 'inherit' }}>Only one valid answer exists.</li>
                                    </ul>
                                </div>
                            </div>
                        </aside>

                        {/* Middle Panel: Code Editor */}
                        <div className="flex-1 flex flex-col bg-[#0b0e14] min-w-0">
                            {/* Editor Toolbar */}
                            <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-[#111621] border-b border-[#e8ebf3] dark:border-[#2d3748] shrink-0">
                                <div className="flex items-center gap-2">
                                    {/* Language Selector */}
                                    <div className="relative" ref={langRef}>
                                        <button
                                            onClick={() => setShowLangMenu(!showLangMenu)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-[#5586e7] text-sm font-semibold rounded-lg border border-blue-100 dark:border-blue-800"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">code</span>
                                            {lang}
                                            <span className="material-symbols-outlined text-[18px]">expand_more</span>
                                        </button>
                                        {showLangMenu && (
                                            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden min-w-[160px]">
                                                {LANGUAGES.map((l) => (
                                                    <button
                                                        key={l}
                                                        onClick={() => { setLang(l); setShowLangMenu(false) }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${l === lang ? 'bg-[#5586e7]/10 text-[#5586e7]' : 'hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white'}`}
                                                    >
                                                        {l}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors" title="Reset code">
                                        <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleRun}
                                        disabled={isRunning}
                                        className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">{isRunning ? 'hourglass_empty' : 'play_arrow'}</span>
                                        {isRunning ? 'Running...' : 'Run'}
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isRunning}
                                        className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold text-white bg-[#5586e7] hover:bg-[#4474d6] rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                                        Submit
                                    </button>
                                </div>
                            </div>

                            {/* Code Area (Monaco) */}
                            <div className="flex-1 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm overflow-hidden relative">
                                <div className="absolute inset-0 flex">
                                    {/* Line Numbers handled by Monaco */}
                                    <div ref={editorContainerRef} className="flex-1" />
                                </div>
                            </div>

                            {/* Console Panel */}
                            <div className="h-1/3 border-t border-[#e8ebf3] dark:border-[#2d3748] bg-white dark:bg-[#111621] flex flex-col shrink-0">
                                <div className="flex items-center gap-6 px-4 py-2 border-b border-[#e8ebf3] dark:border-[#2d3748]">
                                    {(['testcase', 'result'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`text-sm font-bold pb-1 capitalize transition-colors ${activeTab === tab ? 'text-[#5586e7] border-b-2 border-[#5586e7]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex-1 overflow-y-auto p-4">
                                    {activeTab === 'testcase' ? (
                                        <>
                                            <div className="flex gap-2 mb-4">
                                                {[1, 2, 3].map((c) => (
                                                    <button
                                                        key={c}
                                                        onClick={() => setActiveCase(c)}
                                                        className={`px-3 py-1 text-xs font-semibold rounded-md border transition-colors ${activeCase === c ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-white' : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-gray-800'}`}
                                                    >
                                                        Case {c}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">nums =</label>
                                                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg font-mono text-sm dark:text-white">
                                                        {activeCase === 1 ? '[2,7,11,15]' : activeCase === 2 ? '[3,2,4]' : '[3,3]'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">target =</label>
                                                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg font-mono text-sm dark:text-white">
                                                        {activeCase === 1 ? '9' : '6'}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-3">
                                            {isRunning ? (
                                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                                    <span className="material-symbols-outlined animate-spin text-[#5586e7]">refresh</span>
                                                    Running test cases...
                                                </div>
                                            ) : submitted ? (
                                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-green-500">check_circle</span>
                                                        <span className="font-bold text-green-700">Accepted</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                                                        <div>
                                                            <p className="text-gray-500">Runtime</p>
                                                            <p className="font-bold dark:text-white">52 ms <span className="text-green-600 font-normal">Beats 94.2%</span></p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Memory</p>
                                                            <p className="font-bold dark:text-white">16.2 MB <span className="text-green-600 font-normal">Beats 87.1%</span></p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                                    <span className="material-symbols-outlined">terminal</span>
                                                    Run code to see results here
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: AI Insights */}
                        <aside className="w-72 xl:w-80 border-l border-[#e8ebf3] dark:border-[#2d3748] bg-blue-50 dark:bg-[#1a202c] hidden lg:flex lg:flex-col shrink-0">
                            <div className="p-4 border-b border-[#d1d9e6] dark:border-[#2d3748] flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#5586e7]">psychology</span>
                                    <h3 className="font-bold text-sm tracking-tight text-[#5586e7]">AI Behavioral Insights</h3>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {/* Live Performance */}
                                <div className="bg-white dark:bg-[#111621] p-4 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900/30">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Live Performance</h4>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Focus Score', value: '88%', pct: 88, color: 'bg-[#5586e7]', textColor: 'text-[#5586e7]' },
                                            { label: 'Time Efficiency', value: 'Optimal', pct: 95, color: 'bg-green-400', textColor: 'text-green-500' },
                                            { label: 'Code Quality', value: '92%', pct: 92, color: 'bg-purple-400', textColor: 'text-purple-500' },
                                        ].map((item) => (
                                            <div key={item.label}>
                                                <div className="flex justify-between text-xs mb-1 font-medium">
                                                    <span className="dark:text-gray-300">{item.label}</span>
                                                    <span className={`font-bold ${item.textColor}`}>{item.value}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* AI Suggestion */}
                                <div className="bg-[#5586e7]/10 border border-[#5586e7]/20 p-4 rounded-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <span className="material-symbols-outlined text-4xl">lightbulb</span>
                                    </div>
                                    <h4 className="text-[#5586e7] font-bold text-sm mb-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[18px]">psychology</span>
                                        Pattern Detected
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                        You're using a single-pass hash map approach — the most efficient solution (O(n)).
                                        <br /><br />
                                        <span className="font-bold text-[#5586e7]">Next step:</span> Try considering edge cases like empty lists or no matching pairs.
                                    </p>
                                </div>

                                {/* Behavioral History */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase px-1">Behavioral History</h4>
                                    {BEHAVIORAL_HISTORY.map((item, index) => (
                                        <div key={index} className="flex gap-3 px-1">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                                {index < BEHAVIORAL_HISTORY.length - 1 && (
                                                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                                                )}
                                            </div>
                                            <div className="pb-2">
                                                <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{item.text}</p>
                                                <p className="text-[10px] text-gray-500">{item.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* AI Ask Button */}
                            <div className="p-4 bg-white/50 dark:bg-black/20 border-t border-[#d1d9e6] dark:border-gray-800 text-[11px] text-slate-600 dark:text-slate-300">
                                <p className="font-bold mb-1 text-[#5586e7]">Ask AI Assistant</p>
                                <p className="leading-relaxed">
                                    In the next phase this panel will host an interactive AI assistant that can review your code,
                                    explain solutions, and suggest improvements in real time.
                                </p>
                            </div>
                        </aside>
                    </div>

            </div>
        </div>
    )
}
