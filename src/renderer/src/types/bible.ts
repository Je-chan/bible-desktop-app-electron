export interface BibleVerse {
  book: string
  chapter: number
  verse: number
  text: string
}

export interface BibleBook {
  id: number // DB에서 사용하는 책 번호
  name: string
  abbr: string
  chapters: number
}

export interface SearchResult {
  book: string
  chapter: number
  verse: number
  text: string
  reference: string
}
