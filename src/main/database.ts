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
  const stmt = db.prepare('SELECT btext FROM Bible WHERE book = ? AND chapter = ? AND verse = ?')
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
export const getMaxVerse = (version: string, book: number, chapter: number): number => {
  const db = getDb(version)
  const stmt = db.prepare('SELECT MAX(verse) as maxVerse FROM Bible WHERE book = ? AND chapter = ?')
  const row = stmt.get(book, chapter) as { maxVerse: number } | undefined
  return row?.maxVerse ?? 0
}

// 범위 내 구절 수 조회 (교독문 모드용)
export const countVersesInRange = (
  version: string,
  startBook: number,
  startChapter: number,
  startVerse: number,
  endBook: number,
  endChapter: number,
  endVerse: number
): number => {
  const db = getDb(version)

  if (startBook === endBook && startChapter === endChapter) {
    const stmt = db.prepare(
      'SELECT COUNT(*) as count FROM Bible WHERE book = ? AND chapter = ? AND verse >= ? AND verse <= ?'
    )
    const row = stmt.get(startBook, startChapter, startVerse, endVerse) as { count: number }
    return row.count
  }

  // 복잡한 범위: 절대 위치 비교
  const stmt = db.prepare(
    `SELECT COUNT(*) as count FROM Bible
     WHERE (book * 1000000 + chapter * 1000 + verse) >= ?
       AND (book * 1000000 + chapter * 1000 + verse) <= ?`
  )
  const startPos = startBook * 1000000 + startChapter * 1000 + startVerse
  const endPos = endBook * 1000000 + endChapter * 1000 + endVerse
  const row = stmt.get(startPos, endPos) as { count: number }
  return row.count
}

// 범위 내 구절의 인덱스 조회 (교독문 모드용)
export const getVerseIndexInRange = (
  version: string,
  bookNumber: number,
  chapter: number,
  verse: number,
  startBook: number,
  startChapter: number,
  startVerse: number
): number => {
  const db = getDb(version)
  const currentPos = bookNumber * 1000000 + chapter * 1000 + verse
  const startPos = startBook * 1000000 + startChapter * 1000 + startVerse

  const stmt = db.prepare(
    `SELECT COUNT(*) as count FROM Bible
     WHERE (book * 1000000 + chapter * 1000 + verse) >= ?
       AND (book * 1000000 + chapter * 1000 + verse) < ?`
  )
  const row = stmt.get(startPos, currentPos) as { count: number }
  return row.count
}

// 텍스트 검색 (범위 지정 + 페이지네이션 + 다중 키워드)
export const searchVerses = (
  version: string,
  keywords: string[],
  startBook: number = 1,
  endBook: number = 66,
  limit: number = 100,
  offset: number = 0
): Array<{ book: number; chapter: number; verse: number; text: string }> => {
  const db = getDb(version)

  // startBook > endBook이면 swap
  const [minBook, maxBook] = startBook <= endBook ? [startBook, endBook] : [endBook, startBook]

  // 빈 키워드 제외
  const validKeywords = keywords.filter((k) => k.trim() !== '')
  if (validKeywords.length === 0) {
    return []
  }

  // 각 키워드에 대해 LIKE 조건 생성 (AND 조합)
  const likeConditions = validKeywords.map(() => 'btext LIKE ?').join(' AND ')
  const likeParams = validKeywords.map((k) => `%${k}%`)

  const stmt = db.prepare(
    `SELECT book, chapter, verse, btext as text
     FROM Bible
     WHERE ${likeConditions} AND book >= ? AND book <= ?
     ORDER BY book, chapter, verse
     LIMIT ? OFFSET ?`
  )
  return stmt.all(...likeParams, minBook, maxBook, limit, offset) as Array<{
    book: number
    chapter: number
    verse: number
    text: string
  }>
}

// 검색 결과 총 개수 (범위 지정 + 다중 키워드)
export const searchVersesCount = (
  version: string,
  keywords: string[],
  startBook: number = 1,
  endBook: number = 66
): number => {
  const db = getDb(version)

  // startBook > endBook이면 swap
  const [minBook, maxBook] = startBook <= endBook ? [startBook, endBook] : [endBook, startBook]

  // 빈 키워드 제외
  const validKeywords = keywords.filter((k) => k.trim() !== '')
  if (validKeywords.length === 0) {
    return 0
  }

  // 각 키워드에 대해 LIKE 조건 생성 (AND 조합)
  const likeConditions = validKeywords.map(() => 'btext LIKE ?').join(' AND ')
  const likeParams = validKeywords.map((k) => `%${k}%`)

  const stmt = db.prepare(
    `SELECT COUNT(*) as count
     FROM Bible
     WHERE ${likeConditions} AND book >= ? AND book <= ?`
  )
  const row = stmt.get(...likeParams, minBook, maxBook) as { count: number }
  return row.count
}
