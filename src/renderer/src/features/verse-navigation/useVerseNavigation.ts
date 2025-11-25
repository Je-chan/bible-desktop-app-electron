import { BIBLE_BOOKS } from '../../shared/config'
import { useBibleStore } from '../../store/useBibleStore'

export const useVerseNavigation = (currentBookId: number, setCurrentBookId: (id: number) => void) => {
  const { currentVerse, fetchVerse, currentVersion } = useBibleStore()

  const navigateVerse = async (direction: 1 | -1) => {
    if (!currentVerse) return

    const currentBook = BIBLE_BOOKS.find((b) => b.id === currentBookId)
    if (!currentBook) return

    let newBookId = currentBookId
    let newChapter = currentVerse.chapter
    let newVerse = currentVerse.verse + direction

    if (direction === 1) {
      const maxVerse = await window.bibleApi.getMaxVerse(currentVersion, currentBookId, currentVerse.chapter)

      if (newVerse > maxVerse) {
        newChapter++
        newVerse = 1

        if (newChapter > currentBook.chapters) {
          const bookIndex = BIBLE_BOOKS.findIndex((b) => b.id === currentBookId)
          if (bookIndex < BIBLE_BOOKS.length - 1) {
            const nextBook = BIBLE_BOOKS[bookIndex + 1]
            newBookId = nextBook.id
            newChapter = 1
            newVerse = 1
          } else {
            return
          }
        }
      }
    } else {
      if (newVerse < 1) {
        newChapter--

        if (newChapter < 1) {
          const bookIndex = BIBLE_BOOKS.findIndex((b) => b.id === currentBookId)
          if (bookIndex > 0) {
            const prevBook = BIBLE_BOOKS[bookIndex - 1]
            newBookId = prevBook.id
            newChapter = prevBook.chapters
          } else {
            return
          }
        }

        newVerse = await window.bibleApi.getMaxVerse(currentVersion, newBookId, newChapter)
      }
    }

    const newBook = BIBLE_BOOKS.find((b) => b.id === newBookId)
    if (newBook) {
      setCurrentBookId(newBookId)
      await fetchVerse(newBook.abbr, newBookId, newChapter, newVerse)
    }
  }

  return { navigateVerse }
}
