/**
 * 영문 자판 입력을 한글로 변환하는 유틸리티
 * 두벌식 키보드 기준
 */

// 영문 키 → 한글 자모 매핑
const ENG_TO_JAMO: Record<string, string> = {
  // 자음
  q: 'ㅂ',
  w: 'ㅈ',
  e: 'ㄷ',
  r: 'ㄱ',
  t: 'ㅅ',
  a: 'ㅁ',
  s: 'ㄴ',
  d: 'ㅇ',
  f: 'ㄹ',
  g: 'ㅎ',
  z: 'ㅋ',
  x: 'ㅌ',
  c: 'ㅊ',
  v: 'ㅍ',
  // 모음
  y: 'ㅛ',
  u: 'ㅕ',
  i: 'ㅑ',
  o: 'ㅐ',
  p: 'ㅔ',
  h: 'ㅗ',
  j: 'ㅓ',
  k: 'ㅏ',
  l: 'ㅣ',
  b: 'ㅠ',
  n: 'ㅜ',
  m: 'ㅡ',
  // Shift + 자음 (쌍자음)
  Q: 'ㅃ',
  W: 'ㅉ',
  E: 'ㄸ',
  R: 'ㄲ',
  T: 'ㅆ',
  // Shift + 모음
  O: 'ㅒ',
  P: 'ㅖ'
}

// 초성 목록 (19개)
const CHOSUNG = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ'
]

// 중성 목록 (21개)
const JUNGSUNG = [
  'ㅏ',
  'ㅐ',
  'ㅑ',
  'ㅒ',
  'ㅓ',
  'ㅔ',
  'ㅕ',
  'ㅖ',
  'ㅗ',
  'ㅘ',
  'ㅙ',
  'ㅚ',
  'ㅛ',
  'ㅜ',
  'ㅝ',
  'ㅞ',
  'ㅟ',
  'ㅠ',
  'ㅡ',
  'ㅢ',
  'ㅣ'
]

// 종성 목록 (28개, 0번은 종성 없음)
const JONGSUNG = [
  '',
  'ㄱ',
  'ㄲ',
  'ㄳ',
  'ㄴ',
  'ㄵ',
  'ㄶ',
  'ㄷ',
  'ㄹ',
  'ㄺ',
  'ㄻ',
  'ㄼ',
  'ㄽ',
  'ㄾ',
  'ㄿ',
  'ㅀ',
  'ㅁ',
  'ㅂ',
  'ㅄ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ'
]

// 복합 모음 조합 규칙
const DOUBLE_JUNGSUNG: Record<string, string> = {
  ㅗㅏ: 'ㅘ',
  ㅗㅐ: 'ㅙ',
  ㅗㅣ: 'ㅚ',
  ㅜㅓ: 'ㅝ',
  ㅜㅔ: 'ㅞ',
  ㅜㅣ: 'ㅟ',
  ㅡㅣ: 'ㅢ'
}

// 복합 종성 조합 규칙
const DOUBLE_JONGSUNG: Record<string, string> = {
  ㄱㅅ: 'ㄳ',
  ㄴㅈ: 'ㄵ',
  ㄴㅎ: 'ㄶ',
  ㄹㄱ: 'ㄺ',
  ㄹㅁ: 'ㄻ',
  ㄹㅂ: 'ㄼ',
  ㄹㅅ: 'ㄽ',
  ㄹㅌ: 'ㄾ',
  ㄹㅍ: 'ㄿ',
  ㄹㅎ: 'ㅀ',
  ㅂㅅ: 'ㅄ'
}

// 자모인지 확인
const isJamo = (char: string): boolean => {
  const code = char.charCodeAt(0)
  return code >= 0x3131 && code <= 0x3163
}

// 자음인지 확인
const isConsonant = (char: string): boolean => {
  return CHOSUNG.includes(char) || char === 'ㄳ' || char === 'ㄵ' || char === 'ㄶ'
}

// 모음인지 확인
const isVowel = (char: string): boolean => {
  return JUNGSUNG.includes(char)
}

// 초성으로 사용 가능한지 확인
const canBeChosung = (char: string): boolean => {
  return CHOSUNG.includes(char)
}

// 종성으로 사용 가능한지 확인
const canBeJongsung = (char: string): boolean => {
  return JONGSUNG.includes(char)
}

// 완성형 한글 조합
const composeHangul = (cho: string, jung: string, jong: string = ''): string => {
  const choIndex = CHOSUNG.indexOf(cho)
  const jungIndex = JUNGSUNG.indexOf(jung)
  const jongIndex = JONGSUNG.indexOf(jong)

  if (choIndex === -1 || jungIndex === -1) return ''

  const code = 0xac00 + choIndex * 21 * 28 + jungIndex * 28 + (jongIndex === -1 ? 0 : jongIndex)
  return String.fromCharCode(code)
}

/**
 * 영문 문자열을 한글로 변환
 */
export function engToKor(input: string): string {
  // 영문자가 포함되어 있는지 확인
  if (!/[a-zA-Z]/.test(input)) {
    return input
  }

  // 영문 → 자모 변환
  const jamos: string[] = []
  for (const char of input) {
    if (ENG_TO_JAMO[char]) {
      jamos.push(ENG_TO_JAMO[char])
    } else {
      jamos.push(char)
    }
  }

  // 자모 조합
  const result: string[] = []
  let i = 0

  while (i < jamos.length) {
    const current = jamos[i]

    // 현재 문자가 자모가 아니면 그대로 추가
    if (!isJamo(current)) {
      result.push(current)
      i++
      continue
    }

    // 자음인 경우
    if (isConsonant(current) && canBeChosung(current)) {
      const next = jamos[i + 1]

      // 다음이 모음이면 초성으로 사용
      if (next && isVowel(next)) {
        let jung = next
        let jungLen = 1

        // 복합 모음 확인
        const nextNext = jamos[i + 2]
        if (nextNext && isVowel(nextNext)) {
          const combined = DOUBLE_JUNGSUNG[jung + nextNext]
          if (combined) {
            jung = combined
            jungLen = 2
          }
        }

        // 종성 확인
        let jong = ''
        let jongLen = 0
        const afterJung = jamos[i + 1 + jungLen]

        if (afterJung && isConsonant(afterJung) && canBeJongsung(afterJung)) {
          const afterJong = jamos[i + 2 + jungLen]

          // 다음 문자가 모음이면 현재 자음은 다음 글자의 초성
          if (afterJong && isVowel(afterJong)) {
            // 종성 없이 완성
          } else {
            // 복합 종성 확인
            if (afterJong && isConsonant(afterJong)) {
              const combinedJong = DOUBLE_JONGSUNG[afterJung + afterJong]
              if (combinedJong && canBeJongsung(combinedJong)) {
                const afterCombined = jamos[i + 3 + jungLen]
                // 복합 종성 다음이 모음이면 두 번째 자음은 다음 초성
                if (afterCombined && isVowel(afterCombined)) {
                  jong = afterJung
                  jongLen = 1
                } else {
                  jong = combinedJong
                  jongLen = 2
                }
              } else {
                // 복합 종성이 안 되면 첫 번째만 종성
                jong = afterJung
                jongLen = 1
              }
            } else {
              jong = afterJung
              jongLen = 1
            }
          }
        }

        result.push(composeHangul(current, jung, jong))
        i += 1 + jungLen + jongLen
      } else {
        // 다음이 모음이 아니면 자음 그대로
        result.push(current)
        i++
      }
    } else if (isVowel(current)) {
      // 모음만 있는 경우 그대로
      result.push(current)
      i++
    } else {
      result.push(current)
      i++
    }
  }

  return result.join('')
}
