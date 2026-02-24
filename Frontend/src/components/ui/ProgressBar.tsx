interface ProgressBarProps {
    value: number
    max?: number
    /** Tailwind fill color class e.g. 'bg-[#5586e7]' */
    color?: string
    /** Tailwind track bg class e.g. 'bg-gray-100 dark:bg-gray-800' */
    trackColor?: string
    height?: string
    showLabel?: boolean
    label?: string
    className?: string
}

export default function ProgressBar({
    value,
    max = 100,
    color = 'bg-[#5586e7]',
    trackColor = 'bg-gray-100 dark:bg-gray-800',
    height = 'h-2',
    showLabel = false,
    label,
    className = '',
}: ProgressBarProps) {
    const percent = Math.min((value / max) * 100, 100)

    return (
        <div className={className}>
            {(showLabel || label) && (
                <div className="flex justify-between text-xs mb-1 font-medium">
                    {label && <span>{label}</span>}
                    {showLabel && <span className="font-bold">{Math.round(percent)}%</span>}
                </div>
            )}
            <div className={`w-full ${height} ${trackColor} rounded-full overflow-hidden`}>
                <div
                    className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    )
}
