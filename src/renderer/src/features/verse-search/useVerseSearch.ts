import { findBook } from '../../shared/config'
import { useBibleStore } from '../../store/useBibleStore'

interface UseVerseSearchProps {
  book: string
  chapter: string
  verse: string
  setBook: (value: string) => void
  setCurrentBookId: (id: number) => void
  bookRef: React.RefObject<HTMLInputElement | null>
  chapterRef: React.RefObject<HTMLInputElement | null>
  verseRef: React.RefObject<HTMLInputElement | null>
}

export const useVerseSearch = ({
  book,
  chapter,
  verse,
  setBook,
  setCurrentBookId,
  bookRef,
  chapterRef,
  verseRef
}: UseVerseSearchProps) => {
  const { fetchVerse } = useBibleStore()

  const handleSearch = async () => {
    if (!book) {
      bookRef.current?.focus()
      return
    }
    if (!chapter) {
      chapterRef.current?.focus()
      return
    }
    if (!verse) {
      verseRef.current?.focus()
      return
    }

    const foundBook = findBook(book)
    if (!foundBook) {
      bookRef.current?.focus()
      return
    }

    setCurrentBookId(foundBook.id)
    const found = await fetchVerse(foundBook.name, foundBook.id, parseInt(chapter), parseInt(verse))

    if (!found) {
      setBook('')
      bookRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: 'book' | 'chapter' | 'verse') => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
      ;(e.target as HTMLInputElement).blur()
    } else if (e.key === 'Tab' && !e.shiftKey && field === 'verse') {
      e.preventDefault()
      if (book && chapter && verse) {
        handleSearch()
      }
      ;(e.target as HTMLInputElement).blur()
    }
  }

  return { handleSearch, handleKeyDown }
}
