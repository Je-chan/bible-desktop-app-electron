import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

// 빌드 후에는 resources 폴더에서 읽음
const getDbPath = (filename: string): string => {
  const isDev = !app.isPackaged
  if (isDev) {
    return path.join(__dirname, '../../resources/bible', filename)
  }
  return path.join(process.resourcesPath, 'bible', filename)
}

// DB 인스턴스 캐싱 (성능 최적화)
const dbCache = new Map<string, Database.Database>()

const getDb = (version: string): Database.Database => {
  if (!dbCache.has(version)) {
    const dbPath = getDbPath(`${version}.bdb`)
    dbCache.set(version, new Database(dbPath, { readonly: true }))
  }
  return dbCache.get(version)!
}

// 구절 조회
export const getVerse = (
  version: string,
  book: number,
  chapter: number,
  verse: number
): string | null => {
  const db = getDb(version)
  const stmt = db.prepare(
    'SELECT btext FROM Bible WHERE book = ? AND chapter = ? AND verse = ?'
  )
  const row = stmt.get(book, chapter, verse) as { btext: string } | undefined
  return row?.btext ?? null
}

// 장 전체 조회 (여러 절 한번에)
export const getChapter = (
  version: string,
  book: number,
  chapter: number
): Array<{ verse: number; text: string }> => {
  const db = getDb(version)
  const stmt = db.prepare(
    'SELECT verse, btext as text FROM Bible WHERE book = ? AND chapter = ? ORDER BY verse'
  )
  return stmt.all(book, chapter) as Array<{ verse: number; text: string }>
}

// 장의 마지막 절 번호 조회
export const getMaxVerse = (
  version: string,
  book: number,
  chapter: number
): number => {
  const db = getDb(version)
  const stmt = db.prepare(
    'SELECT MAX(verse) as maxVerse FROM Bible WHERE book = ? AND chapter = ?'
  )
  const row = stmt.get(book, chapter) as { maxVerse: number } | undefined
  return row?.maxVerse ?? 0
}
