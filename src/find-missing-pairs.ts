import { Combination } from 'js-combinatorics'
import { calculatePairId, ItemPair } from './sheets-api'

export function findMissingPairs (items: string[], existingPairsById: Map<string, ItemPair>): ItemPair[] {
  const combinations = new Combination(items, 2)
  return (Array.from(combinations) as [string, string][])
    .map(([itemA, itemB]) => {
      const id = calculatePairId(itemA, itemB)
      const existingPair = existingPairsById.get(id)
      if (existingPair) {
        if (existingPair.score == null) {
          return existingPair
        } else {
          return null
        }
      } else {
        return { id, itemA, itemB }
      }
    })
    .filter(Boolean) as ItemPair[]
}
