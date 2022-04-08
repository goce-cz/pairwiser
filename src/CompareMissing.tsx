import { FC } from 'react'
import { useData } from './DataProvider'
import { Comparison } from './Comparison'

export const CompareMissing: FC = () => {
  const {missingPairs} = useData()

  return (
    <div>
      {
        missingPairs.map(pair => (
          <Comparison pair={pair} key={pair.id}/>
        ))
      }
    </div>
  )
}
