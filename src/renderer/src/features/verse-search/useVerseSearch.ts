import { useCallback } from 'react'
import { findBook } from '../../shared/config'
import { useBibleStore } from '../../store/useBibleStore'

interface UseVerseSearchProps {
  book: string
  chapter: string
  verse: string
  setBook: (value: string) => void
  setCurrentBookId: (id: number) => void
}

export const useVerseSearch = ({
  book,
  chapter,
  verse,
  setBook,
  setCurrentBookId
}: UseVerseSearchProps) => {
  const { fetchVerse } = useBibleStore()

  const handleSearch = useCallback(async () => {
    if (!book || !chapter || !verse) {
      return
    }

    const foundBook = findBook(book)
    if (!foundBook) {
      setBook('')
      return
    }

    setCurrentBookId(foundBook.id)
    const found = await fetchVerse(foundBook.abbr, foundBook.id, parseInt(chapter), parseInt(verse))

    if (!found) {
      setBook('')
    }
  }, [book, chapter, verse, setBook, setCurrentBookId, fetchVerse])

  return { handleSearch }
}
