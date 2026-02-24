import type { ReactNode } from 'react'
import type { Difficulty } from '../../types'

interface BadgeProps {
    children?: ReactNode
    variant?: 'difficulty' | 'tag' | 'custom'
    difficulty?: Difficulty
    className?: string
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
    Easy: 'bg-green-100 text-green-700',
    Medium: 'bg-amber-100 text-amber-700',
    Hard: 'bg-red-100 text-red-700',
}

export default function Badge({
    children,
    variant = 'custom',
    difficulty,
    className = '',
}: BadgeProps) {
    if (variant === 'difficulty' && difficulty) {
        return (
            <span className={`px-3 py-1 rounded-full font-bold text-xs ${DIFFICULTY_STYLES[difficulty]}`}>
                {difficulty}
            </span>
        )
    }

    if (variant === 'tag') {
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase ${className}`}>
                {children}
            </span>
        )
    }

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${className}`}>
            {children}
        </span>
    )
}
