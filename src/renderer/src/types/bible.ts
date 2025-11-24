export interface BibleVerse {
  book: string
  chapter: number
  verse: number
  text: string
}

export interface BibleBook {
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
