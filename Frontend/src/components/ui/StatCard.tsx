interface StatCardProps {
    label: string
    value: string
    trend?: string
    trendUp?: boolean
    icon: string
    iconBg?: string
    iconColor?: string
    badge?: string
    badgeColor?: string
    accentLeft?: boolean
    className?: string
}

export default function StatCard({
    label,
    value,
    trend,
    trendUp,
    icon,
    iconBg = 'bg-blue-50',
    iconColor = 'text-[#5586e7]',
    badge,
    badgeColor = 'bg-green-100 text-green-600',
    accentLeft = false,
    className = '',
}: StatCardProps) {
    return (
        <div
            className={`bg-white dark:bg-[#191e24] p-6 rounded-xl border border-[#e8ebf3] dark:border-[#2a303c] shadow-sm transition-all hover:shadow-md ${accentLeft ? 'border-l-4 border-l-[#5586e7]' : ''
                } ${className}`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 ${iconBg} rounded-lg`}>
                    <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
                </div>
                {badge && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${badgeColor}`}>
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-[#506795] dark:text-gray-400 text-sm font-medium">{label}</p>
            <h3 className={`text-3xl font-bold mt-1 dark:text-white ${accentLeft ? 'text-[#5586e7] italic' : 'text-slate-900'}`}>
                {value}
            </h3>
            {trend && (
                <p
                    className={`text-xs font-medium mt-2 flex items-center gap-1 ${trendUp === undefined
                            ? 'text-[#506795]'
                            : trendUp
                                ? 'text-green-600'
                                : 'text-red-500'
                        }`}
                >
                    {trendUp !== undefined && (
                        <span className="material-symbols-outlined text-xs">
                            {trendUp ? 'trending_up' : 'trending_down'}
                        </span>
                    )}
                    {trend}
                </p>
            )}
        </div>
    )
}
