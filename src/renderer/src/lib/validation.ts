import { z } from 'zod'
import { BIBLE_BOOKS } from '../shared/config'

// 책 약어가 유효한지 확인
const bookAbbrSchema = z
  .string()
  .refine((abbr) => BIBLE_BOOKS.some((book) => book.abbr === abbr), {
    message: '유효하지 않은 책 약어입니다'
  })

// 개별 절 위치 스키마
const versePositionSchema = z.object({
  bookAbbr: bookAbbrSchema,
  chapter: z.number().int().positive({ message: '장은 1 이상이어야 합니다' }),
  verse: z.number().int().positive({ message: '절은 1 이상이어야 합니다' })
})

// 책의 최대 장 수 확인
const validateChapter = (data: { bookAbbr: string; chapter: number }) => {
  const book = BIBLE_BOOKS.find((b) => b.abbr === data.bookAbbr)
  if (!book) return false
  return data.chapter <= book.chapters
}

// 본문 말씀 범위 스키마
export const scriptureRangeSchema = z
  .object({
    start: versePositionSchema,
    end: versePositionSchema
  })
  .refine((data) => validateChapter(data.start), {
    message: '시작 장이 해당 책의 장 수를 초과합니다',
    path: ['start', 'chapter']
  })
  .refine((data) => validateChapter(data.end), {
    message: '끝 장이 해당 책의 장 수를 초과합니다',
    path: ['end', 'chapter']
  })
  .refine(
    (data) => {
      // 시작과 끝의 절대 위치 비교
      const startBook = BIBLE_BOOKS.find((b) => b.abbr === data.start.bookAbbr)
      const endBook = BIBLE_BOOKS.find((b) => b.abbr === data.end.bookAbbr)
      if (!startBook || !endBook) return false

      const startPos = startBook.id * 1000000 + data.start.chapter * 1000 + data.start.verse
      const endPos = endBook.id * 1000000 + data.end.chapter * 1000 + data.end.verse

      return endPos >= startPos
    },
    { message: '끝 범위는 시작 범위보다 앞설 수 없습니다', path: ['end'] }
  )

// 절의 최대 개수를 확인하는 비동기 함수 (API 호출 필요)
export const validateVerseMax = async (
  bookAbbr: string,
  chapter: number,
  verse: number,
  version: string
): Promise<{ valid: boolean; maxVerse?: number }> => {
  const book = BIBLE_BOOKS.find((b) => b.abbr === bookAbbr)
  if (!book) return { valid: false }

  try {
    const maxVerse = await window.bibleApi.getMaxVerse(version, book.id, chapter)
    return { valid: verse <= maxVerse, maxVerse }
  } catch {
    return { valid: false }
  }
}

export type ScriptureRangeInput = z.infer<typeof scriptureRangeSchema>
