import type { ScriptureRange } from '../../types/bible'

export type ResponsiveReadingRole = 'leader' | 'congregation' | 'unison' | null

export const DEFAULT_RESPONSIVE_COLORS = {
  leader: '#8CC8EB',
  congregation: '#E8A87C',
  unison: '#C49ADE'
}

/**
 * 본문 말씀 범위 내에서 구절의 교독문 역할을 판별한다.
 * - 범위의 첫 번째 절 = 인도자, 두 번째 = 회중, 세 번째 = 인도자... (순서 기반)
 * - 마지막 절이 인도자 차례이면 합독(unison)으로 처리
 * - 범위 밖 구절은 null 반환
 */
export function getResponsiveReadingRole(
  bookNumber: number,
  chapter: number,
  verse: number,
  range: ScriptureRange,
  totalVersesInRange: number,
  indexInRange: number
): ResponsiveReadingRole {
  const currentPos = bookNumber * 1000000 + chapter * 1000 + verse
  const startPos = range.start.bookId * 1000000 + range.start.chapter * 1000 + range.start.verse
  const endPos = range.end.bookId * 1000000 + range.end.chapter * 1000 + range.end.verse

  if (currentPos < startPos || currentPos > endPos) return null

  const isLastVerse = indexInRange === totalVersesInRange - 1
  const isLeaderTurn = indexInRange % 2 === 0

  if (isLastVerse && isLeaderTurn) return 'unison'
  return isLeaderTurn ? 'leader' : 'congregation'
}
