import { FC } from 'react'
import { useData } from './DataProvider'

export interface ComparisonButtonProps {
  pairId: string
  targetScore: number
  currentScore?: number
  className?: string
}

export const ComparisonButton: FC<ComparisonButtonProps> = ({
  pairId,
  targetScore,
  currentScore,
  className,
  children
}) => {
  const { updateScore } = useData()

  return (
    <button
      className={`${className} ${targetScore === currentScore ? '' : 'un'}selected`}
      onClick={() => updateScore(pairId, targetScore)}
    >
      {children}
    </button>
  )
}
