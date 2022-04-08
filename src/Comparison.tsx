import { ItemPair } from './sheets-api'
import { VFC } from 'react'
import { ComparisonButton } from './ComparisonButton'

export interface ComparisonProps {
  pair: ItemPair
}

export const Comparison: VFC<ComparisonProps> = ({
  pair
}) => {
  return (
    <div className={`comparison ${pair.score == null ? 'un' : ''}answered`}>
      <ComparisonButton pairId={pair.id} targetScore={1} currentScore={pair.score} className="itemA item">
        {pair.itemA}
      </ComparisonButton>
      <ComparisonButton pairId={pair.id} targetScore={0} currentScore={pair.score} className="equal">
        equal
      </ComparisonButton>
      <ComparisonButton pairId={pair.id} targetScore={-1} currentScore={pair.score} className="itemB item">
        {pair.itemB}
      </ComparisonButton>
    </div>
  )
}
