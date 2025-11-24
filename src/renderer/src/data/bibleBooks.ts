import type { BibleBook } from '../types/bible'

export const BIBLE_BOOKS: BibleBook[] = [
  // 구약
  { name: '창세기', abbr: '창', chapters: 50 },
  { name: '출애굽기', abbr: '출', chapters: 40 },
  { name: '레위기', abbr: '레', chapters: 27 },
  { name: '민수기', abbr: '민', chapters: 36 },
  { name: '신명기', abbr: '신', chapters: 34 },
  // ... 나중에 전체 추가

  // 신약
  { name: '마태복음', abbr: '마', chapters: 28 },
  { name: '마가복음', abbr: '막', chapters: 16 },
  { name: '누가복음', abbr: '눅', chapters: 24 },
  { name: '요한복음', abbr: '요', chapters: 21 },
  { name: '사도행전', abbr: '행', chapters: 28 }
  // ... 나중에 전체 추가
]

// 책 이름/약어로 검색
export function findBook(query: string): BibleBook | undefined {
  const normalized = query.trim()
  return BIBLE_BOOKS.find((book) => book.name === normalized || book.abbr === normalized)
}
