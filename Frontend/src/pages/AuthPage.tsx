import { useState, type FormEvent } from 'react'
import type { AuthMode, Page } from '../types'
import Footer from '../components/layout/Footer'

interface AuthPageProps {
    onNavigate: (page: Page) => void
}

export default function AuthPage({ onNavigate }: AuthPageProps) {
    const [mode, setMode] = useState<AuthMode>('login')
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        onNavigate('problems')
    }

    return (
        <div className="bg-[#f6f6f8] dark:bg-[#111621] min-h-screen flex flex-col font-[Space_Grotesk] text-[#0e121b] dark:text-white">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-[#e8ebf3] dark:border-gray-800 bg-white/80 dark:bg-[#111621]/80 backdrop-blur-md px-6 md:px-10 py-3 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-[#5586e7] rounded-lg flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-2xl">terminal</span>
                    </div>
                    <h2 className="text-xl font-bold leading-tight tracking-tight dark:text-white">InsightCode</h2>
                </div>
                <div className="flex items-center gap-4 md:gap-8">
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="#" className="text-[#506795] dark:text-gray-400 text-sm font-medium hover:text-[#5586e7] transition-colors">Docs</a>
                        <a href="#" className="text-[#506795] dark:text-gray-400 text-sm font-medium hover:text-[#5586e7] transition-colors">Pricing</a>
                    </nav>
                    <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 border border-[#d1d8e6] dark:border-gray-700 text-sm font-bold transition-all hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white">
                        Support
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute inset-0 pastel-grid pointer-events-none" />
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#5586e7]/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#5586e7]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="w-full max-w-[1100px] grid md:grid-cols-2 gap-12 items-center relative z-10">
                    {/* Left Side: Branding */}
                    <div className="hidden md:flex flex-col gap-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5586e7]/10 text-[#5586e7] text-xs font-bold uppercase tracking-wider w-fit">
                            <span className="material-symbols-outlined text-sm">auto_awesome</span>
                            Next-Gen Code Intelligence
                        </div>
                        <h1 className="text-5xl font-bold leading-[1.1] tracking-tight dark:text-white">
                            Analyze. Optimize.{' '}
                            <span className="text-[#5586e7]">Secure.</span>
                        </h1>
                        <p className="text-[#506795] dark:text-gray-400 text-lg max-w-md leading-relaxed">
                            The intelligent code analysis platform for modern developers. Deploy cleaner, safer code with AI-driven insights.
                        </p>

                        {/* Feature List */}
                        <div className="flex flex-col gap-4 mt-4">
                            {[
                                'Real-time vulnerability scanning',
                                'Automated PR reviews',
                                'Seamless CI/CD integration',
                            ].map((feature) => (
                                <div key={feature} className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[#5586e7]">check_circle</span>
                                    <span className="text-sm font-medium dark:text-white">{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* Code Terminal Mockup */}
                        <div className="mt-8 rounded-xl overflow-hidden border border-[#d1d8e6] dark:border-gray-800 shadow-2xl bg-white dark:bg-gray-900 aspect-video relative group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#5586e7]/20 to-transparent" />
                            <div className="p-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                                <p className="text-[#5586e7]"># Analyzing repository...</p>
                                <p>&gt; Fetching main branch</p>
                                <p>&gt; Running security audit (CVE-2024-X)</p>
                                <p className="text-green-500">&gt; No critical vulnerabilities found.</p>
                                <p>&gt; Performance score: <span className="text-yellow-500">98/100</span></p>
                            </div>
                            <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 flex items-center gap-2 scale-90 group-hover:scale-100 transition-transform">
                                <span className="material-symbols-outlined text-[#5586e7]">analytics</span>
                                <span className="text-xs font-bold dark:text-white">Analysis Ready</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Auth Card */}
                    <div className="flex justify-center md:justify-end">
                        <div className="bg-white dark:bg-gray-900 w-full max-w-[440px] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-[#e8ebf3] dark:border-gray-800 p-8 flex flex-col gap-6">
                            {/* Heading */}
                            <div className="flex flex-col gap-2">
                                <h2 className="text-2xl font-bold dark:text-white tracking-tight">
                                    {mode === 'login' ? 'Welcome back' : 'Create account'}
                                </h2>
                                <p className="text-[#506795] dark:text-gray-400 text-sm">
                                    {mode === 'login'
                                        ? 'Enter your credentials to access your dashboard.'
                                        : 'Start your AI-powered coding journey today.'}
                                </p>
                            </div>

                            {/* Toggle Tabs */}
                            <div className="flex p-1 bg-[#f6f6f8] dark:bg-gray-800 rounded-lg">
                                {(['login', 'register'] as AuthMode[]).map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all capitalize ${mode === m
                                            ? 'bg-white dark:bg-gray-700 text-[#0e121b] dark:text-white shadow-sm'
                                            : 'text-[#506795] dark:text-gray-400 hover:text-[#0e121b] dark:hover:text-white'
                                            }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>

                            {/* Auth Form */}
                            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                                {mode === 'register' && (
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-bold dark:text-white">Full Name</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">person</span>
                                            <input
                                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#d1d8e6] dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#5586e7] focus:border-[#5586e7] outline-none dark:text-white transition-all"
                                                placeholder="John Doe"
                                                type="text"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-bold dark:text-white">Email Address</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">mail</span>
                                        <input
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#d1d8e6] dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#5586e7] focus:border-[#5586e7] outline-none dark:text-white transition-all"
                                            placeholder="dev@company.com"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold dark:text-white">Password</label>
                                        {mode === 'login' && (
                                            <a href="#" className="text-xs font-bold text-[#5586e7] hover:underline">Forgot?</a>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">lock</span>
                                        <input
                                            className="w-full pl-10 pr-10 py-3 rounded-lg border border-[#d1d8e6] dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#5586e7] focus:border-[#5586e7] outline-none dark:text-white transition-all"
                                            placeholder="••••••••"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#5586e7] transition-colors cursor-pointer text-xl"
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    className="mt-2 w-full h-12 bg-[#5586e7] text-white font-bold rounded-lg shadow-lg shadow-[#5586e7]/20 hover:bg-[#4474d6] transition-all active:scale-[0.98]"
                                    type="submit"
                                >
                                    {mode === 'login' ? 'Sign In to InsightCode' : 'Create Account'}
                                </button>
                            </form>

                            {/* CLI Hint */}
                            <div className="p-3 bg-[#5586e7]/5 rounded-lg border border-[#5586e7]/10 flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#5586e7] text-lg">terminal</span>
                                <p className="text-xs text-[#506795] dark:text-gray-400 leading-tight">
                                    Prefer the command line? Run{' '}
                                    <code className="bg-[#5586e7]/10 px-1 py-0.5 rounded text-[#5586e7] font-bold">
                                        insight auth login
                                    </code>{' '}
                                    in your terminal.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer variant="minimal" />
        </div>
    )
}
