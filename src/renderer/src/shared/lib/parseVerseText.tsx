import { ReactNode } from 'react'

/**
 * 성경 구절 텍스트에서 안전한 태그만 React 요소로 변환
 * 허용 태그: <sup>, <br>
 */
export const parseVerseText = (text: string): ReactNode[] => {
  const result: ReactNode[] = []
  let key = 0

  // <sup>...</sup> 와 <br> 태그만 매칭
  const tagRegex = /<sup>(.*?)<\/sup>|<br\s*\/?>/gi
  let lastIndex = 0
  let match

  while ((match = tagRegex.exec(text)) !== null) {
    // 태그 이전의 일반 텍스트
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index))
    }

    // 매칭된 태그 처리
    if (match[0].toLowerCase().startsWith('<sup>')) {
      // <sup> 태그
      result.push(<sup key={key++}>{match[1]}</sup>)
    } else if (match[0].toLowerCase().startsWith('<br')) {
      // <br> 태그
      result.push(<br key={key++} />)
    }

    lastIndex = tagRegex.lastIndex
  }

  // 마지막 태그 이후의 텍스트
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex))
  }

  return result
}
