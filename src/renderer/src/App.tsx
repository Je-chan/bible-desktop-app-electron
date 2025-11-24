import { useState } from 'react'
import { Search, Book, Clock } from 'lucide-react'
import { useBibleStore } from './store/useBibleStore'
import { findBook } from './data/bibleBooks'
import { cn } from './lib/utils'

function App() {
  const [book, setBook] = useState('')
  const [chapter, setChapter] = useState('')
  const [verse, setVerse] = useState('')

  const { currentVerse, recentSearches, setCurrentVerse, addToRecent } = useBibleStore()

  const handleSearch = () => {
    if (!book || !chapter || !verse) return

    const foundBook = findBook(book)
    if (!foundBook) {
      alert('책을 찾을 수 없습니다.')
      return
    }

    const result = {
      book: foundBook.name,
      chapter: parseInt(chapter),
      verse: parseInt(verse),
      text: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라 (예시 본문)',
      reference: `${foundBook.name} ${chapter}:${verse}`
    }

    setCurrentVerse(result)
    addToRecent(result)
  }

  const handleKeyDown = (e: React.KeyboardEvent, nextField: string) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      document.getElementById(nextField)?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-6 text-white">
          <div className="flex items-center justify-center gap-3">
            <Book className="w-8 h-8" />
            <h1 className="text-3xl font-bold">성경 앱</h1>
          </div>
        </div>

        {/* Search Section */}
        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            <input
              id="book"
              type="text"
              placeholder="책 (예: 창, 요)"
              value={book}
              onChange={(e) => setBook(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'chapter')}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none transition-colors"
              autoFocus
            />
            <input
              id="chapter"
              type="number"
              placeholder="장"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'verse')}
              className="w-24 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none transition-colors"
            />
            <input
              id="verse"
              type="number"
              placeholder="절"
              value={verse}
              onChange={(e) => setVerse(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-24 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none transition-colors"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              검색
            </button>
          </div>

          {/* Result Section */}
          <div className="bg-gray-50 rounded-xl p-6 min-h-[200px]">
            {currentVerse ? (
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-primary-600">{currentVerse.reference}</h3>
                <p className="text-lg leading-relaxed text-gray-800">{currentVerse.text}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 italic">
                성경 구절을 입력하세요
              </div>
            )}
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3 text-gray-600">
                <Clock className="w-4 h-4" />
                <h3 className="text-sm font-semibold">최근 검색</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentVerse(search)}
                    className="px-3 py-1 bg-gray-100 hover:bg-primary-100 text-sm rounded-full transition-colors"
                  >
                    {search.reference}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
