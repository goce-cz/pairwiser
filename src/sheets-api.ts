import { ITEM_SHEET, SPREADSHEET_ID } from './config'

export interface ItemPair {
  id: string
  row?: number
  itemA: string
  itemB: string
  score?: number
}

export const calculatePairId = (itemA: string, itemB: string) => itemA.localeCompare(itemB) > 0
  ? `${itemA}\0${itemB}`
  : `${itemB}\0${itemA}`

export async function getItems () {
  // @ts-ignore
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ITEM_SHEET}!A2:A999`
  })

  const range: { values: [string][] } = response.result
  return (range.values ?? []).map(row => row[0])
}

export async function getPairs (sheetName: string): Promise<ItemPair[]> {
  // @ts-ignores
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A2:C9999`
  })

  const range: { values: [string, string, number | undefined][] } = response.result
  return (range.values ?? []).map(([itemA, itemB, score], index) => ({
    id: calculatePairId(itemA, itemB),
    row: 2 + index,
    itemA,
    itemB,
    score: score ? Number(score) : undefined
  }))
}

export interface LocatedPair  extends ItemPair {
  row: number
}

export async function writePairs(sheetName: string, pairs: LocatedPair[]) {
  const data = pairs.map(pair => ({
    range: `${sheetName}!A${pair.row}:C${pair.row}`,
    values: [[pair.itemA, pair.itemB, pair.score]]
  }))
  // @ts-ignore
  await gapi.client.sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      valueInputOption: 'RAW',
      data
    }
  })
}
