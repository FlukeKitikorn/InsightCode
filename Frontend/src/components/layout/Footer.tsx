interface FooterProps {
    variant?: 'minimal' | 'full'
}

export default function Footer({ variant = 'full' }: FooterProps) {
    if (variant === 'minimal') {
        return (
            <footer className="p-8 mt-auto flex flex-col items-center gap-4">
                <div className="flex gap-6">
                    {['Terms of Service', 'Privacy Policy', 'Security Audit'].map((link) => (
                        <a
                            key={link}
                            href="#"
                            className="text-xs font-medium text-[#506795] hover:text-[#5586e7] transition-colors"
                        >
                            {link}
                        </a>
                    ))}
                </div>
                <p className="text-[10px] text-[#506795] font-bold uppercase tracking-widest">
                    © 2026 InsightCode. Built for developers.
                </p>
            </footer>
        )
    }

    return (
        <footer className="mt-12 py-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111621]">
            <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2 text-slate-400">
                    <span className="material-symbols-outlined">terminal</span>
                    <span className="font-bold">InsightCode © 2026</span>
                </div>

                <div className="flex flex-wrap justify-center gap-6">
                    {['Help Center', 'Jobs', 'Terms', 'Privacy'].map((link) => (
                        <a
                            key={link}
                            href="#"
                            className="text-sm text-slate-500 hover:text-[#5586e7] transition-colors"
                        >
                            {link}
                        </a>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button className="p-2 text-slate-400 hover:text-[#5586e7] hover:bg-slate-100 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">public</span>
                    </button>
                    <button className="p-2 text-slate-400 hover:text-[#5586e7] hover:bg-slate-100 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">share</span>
                    </button>
                </div>
            </div>
        </footer>
    )
}
