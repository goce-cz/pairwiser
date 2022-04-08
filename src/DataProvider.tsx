import { getItems, getPairs, ItemPair, LocatedPair, writePairs } from './sheets-api'
import { createContext, FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useGoogleAPIData } from './GoogleAPIProvider'
import { findMissingPairs } from './find-missing-pairs'
import { ITEM_SHEET } from './config'
import { debounce } from 'lodash'

export type DataUpdateFunction = (pairId: string, score: number) => void

export interface Data {
  items: string[]
  missingPairs: ItemPair[]
  existingPairsById: Map<string, ItemPair>
  maxRow: number
}

export interface ContextData extends Data {
  sheetName: string
  updateScore: DataUpdateFunction
}

const DataContext = createContext<ContextData | null>(null)

export const useData = () => useContext(DataContext)!

const emailPattern = /^(.+)@/

const pairsById = (existingPairs: ItemPair[]) => new Map(existingPairs.map(pair => [pair.id, pair]))

const comparePairs = (a: ItemPair, b: ItemPair): number => {
  const itemAResult = a.itemA.localeCompare(b.itemA)
  return itemAResult === 0
    ? a.itemB.localeCompare(b.itemB)
    : itemAResult
}

function syncState (updatedPairs: LocatedPair[], data: Data): Data {
  const { existingPairsById, missingPairs } = data!
  const newExistingPairsById = new Map(existingPairsById)
  updatedPairs.forEach(updatedPair => {
    newExistingPairsById.set(updatedPair.id, updatedPair)
  })
  const newMissingPairs = missingPairs.map(pair => newExistingPairsById.get(pair.id) ?? pair)
  return {
    ...data,
    existingPairsById: newExistingPairsById,
    missingPairs: newMissingPairs,
    maxRow: Math.max(1, ...Array.from(newExistingPairsById.values()).map(pair => pair.row ?? 2))
  }
}

const beforeUnloadListener = (event: BeforeUnloadEvent) => {
  event.preventDefault()
  return event.returnValue = 'Last changes you made haven\'t been saved yet. Do you really want to leave?'
}

export const DataProvider: FC = ({
  children
}) => {
  const { loginResponse } = useGoogleAPIData()
  const sheetName = useMemo(
    () => {
      const userName = emailPattern.exec(loginResponse.profileObj.email)![1]
      return `${ITEM_SHEET} - pairs - ${userName}`
    },
    [loginResponse]
  )

  const [data, setData] = useState<Data>()

  const [updates, setUpdates] = useState<Record<string, number>>({})

  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

  const handleSave = useCallback(
    async () => {
      if (savingRef.current) {
        saveDebounced()
        return
      }

      setSaving(saving)
      savingRef.current = true
      try {
        const updateEntries = Object.entries(updates)
        if (updateEntries.length === 0) {
          return
        }

        const { existingPairsById, missingPairs } = data!
        const missingPairsById = pairsById(missingPairs)
        let maxRow = data!.maxRow
        const pairsToWrite = updateEntries.map(([pairId, score]) => {
          const pair = (existingPairsById.get(pairId) ?? missingPairsById.get(pairId))!
          return {
            ...pair,
            row: pair.row ?? ++maxRow,
            score
          }
        })
        await writePairs(sheetName, pairsToWrite)

        setUpdates({})
        setData(oldData => syncState(pairsToWrite, oldData!))
      } finally {
        savingRef.current = false
        setSaving(false)
      }
    },
    // eslint-disable-next-line
    [updates, data, sheetName]
  )

  const hasPendingUpdates = useMemo(() => !!Object.keys(updates).length, [updates])

  useEffect(() => {
    if (hasPendingUpdates) {
      window.addEventListener('beforeunload', beforeUnloadListener, { capture: true })
      return () => window.removeEventListener('beforeunload', beforeUnloadListener, { capture: true })
    }
  }, [hasPendingUpdates])

  const saveRef = useRef(handleSave)
  saveRef.current = handleSave

  const saveDebounced = useMemo(
    () => debounce(() => saveRef.current(), 3000),
    [saveRef]
  )

  const handleUpdate = useCallback<DataUpdateFunction>(
    (pairId, score) => {
      setUpdates(updates => ({
        ...updates,
        [pairId]: score
      }))
      setData(data => ({
        ...data!,
        missingPairs: data!.missingPairs.map(pair => pair.id === pairId
          ? { ...pair, score }
          : pair
        )
      }))
      saveDebounced()
    },
    [saveDebounced]
  )

  useEffect(
    () => {
      (async () => {
        const items = await getItems()
        const existingPairs = await getPairs(sheetName)
        const existingPairsById = pairsById(existingPairs)
        const missingPairs = findMissingPairs(items, existingPairsById)
        missingPairs.sort(comparePairs)
        setData({
          items,
          existingPairsById,
          missingPairs,
          maxRow: Math.max(1, ...existingPairs.map(pair => pair.row ?? 2))
        })
      })().catch(console.error)
    },
    [sheetName]
  )

  if (!data) {
    return <div>Loading...</div>
  }

  return (
    <DataContext.Provider value={{ ...data, updateScore: handleUpdate, sheetName }}>
      <button onClick={handleSave} disabled={saving} className="save">Save</button>
      {children}
    </DataContext.Provider>
  )
}
