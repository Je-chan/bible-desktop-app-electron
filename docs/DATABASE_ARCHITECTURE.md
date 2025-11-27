# 데이터베이스 아키텍처

## 개요

SQLite 데이터베이스를 `better-sqlite3`로 접근합니다.
각 역본은 별도의 `.bdb` 파일로 관리되며, 성능을 위해 인스턴스 캐싱을 사용합니다.

## 파일 구조

```
resources/
└── bible/
    ├── 개역한글.bdb
    ├── 개역개정.bdb
    ├── 새번역.bdb
    ├── NIV2011.bdb
    └── ...
```

## 테이블 스키마

```sql
CREATE TABLE Bible (
  book    INTEGER,  -- 1-66 (창세기-요한계시록)
  chapter INTEGER,
  verse   INTEGER,
  btext   TEXT      -- 본문 (HTML 태그 포함 가능)
)
```

## 데이터베이스 인스턴스 캐싱

### 문제

역본을 바꿀 때마다 DB를 열고 닫으면 성능이 떨어집니다.

### 해결: Map 기반 캐싱

```typescript
// src/main/database.ts

import Database from 'better-sqlite3'

// 버전별 DB 인스턴스 캐시
const dbInstances = new Map<string, Database.Database>()

const getDatabase = (version: string): Database.Database => {
  // 캐시에 있으면 재사용
  if (dbInstances.has(version)) {
    return dbInstances.get(version)!
  }

  // 없으면 새로 열기
  const dbPath = path.join(process.resourcesPath, 'bible', `${version}.bdb`)
  const db = new Database(dbPath, { readonly: true })

  // 캐시에 저장
  dbInstances.set(version, db)

  return db
}
```

### 장점

1. **성능**: 한 번 열린 DB는 앱 종료까지 재사용
2. **읽기 전용**: `{ readonly: true }`로 데이터 보호
3. **동기 API**: better-sqlite3는 동기 방식이라 IPC 핸들러에서 바로 반환 가능

## IPC 통신

### Main Process 핸들러

```typescript
// src/main/index.ts

ipcMain.handle('bible:getVerse', (_, version, bookId, chapter, verse) => {
  return getVerse(version, bookId, chapter, verse)
})

ipcMain.handle('bible:searchVerses', (_, version, keywords, start, end, limit, offset) => {
  return searchVerses(version, keywords, start, end, limit, offset)
})
```

### Preload Bridge

```typescript
// src/preload/index.ts

const bibleApi = {
  getVerse: (version: string, bookId: number, chapter: number, verse: number) =>
    ipcRenderer.invoke('bible:getVerse', version, bookId, chapter, verse),

  searchVerses: (
    version: string,
    keywords: string[],
    startBook: number,
    endBook: number,
    limit: number,
    offset: number
  ) => ipcRenderer.invoke('bible:searchVerses', version, keywords, startBook, endBook, limit, offset)
}

contextBridge.exposeInMainWorld('bibleApi', bibleApi)
```

### Renderer 사용

```typescript
// React 컴포넌트에서
const verse = await window.bibleApi.getVerse('개역한글', 43, 3, 16)
```

## 쿼리 함수들

### getVerse

단일 구절 조회:

```typescript
export const getVerse = (
  version: string,
  bookId: number,
  chapter: number,
  verse: number
) => {
  const db = getDatabase(version)
  const stmt = db.prepare(`
    SELECT book, chapter, verse, btext as text
    FROM Bible
    WHERE book = ? AND chapter = ? AND verse = ?
  `)
  return stmt.get(bookId, chapter, verse)
}
```

### getMaxVerse

특정 장의 최대 절 번호:

```typescript
export const getMaxVerse = (
  version: string,
  bookId: number,
  chapter: number
) => {
  const db = getDatabase(version)
  const stmt = db.prepare(`
    SELECT MAX(verse) as maxVerse
    FROM Bible
    WHERE book = ? AND chapter = ?
  `)
  return stmt.get(bookId, chapter)?.maxVerse ?? 0
}
```

구절 탐색에서 경계 체크에 사용됩니다.

### searchVerses

다중 키워드 검색:

```typescript
export const searchVerses = (
  version: string,
  keywords: string[],
  startBook: number = 1,
  endBook: number = 66,
  limit: number = 100,
  offset: number = 0
) => {
  const db = getDatabase(version)

  // 빈 키워드 필터링
  const validKeywords = keywords.filter((k) => k.trim() !== '')
  if (validKeywords.length === 0) return []

  // 동적 WHERE 생성
  const likeConditions = validKeywords.map(() => 'btext LIKE ?').join(' AND ')
  const likeParams = validKeywords.map((k) => `%${k}%`)

  const stmt = db.prepare(`
    SELECT book, chapter, verse, btext as text
    FROM Bible
    WHERE book >= ? AND book <= ?
      AND ${likeConditions}
    ORDER BY book, chapter, verse
    LIMIT ? OFFSET ?
  `)

  return stmt.all(startBook, endBook, ...likeParams, limit, offset)
}
```

## 보안 고려사항

### SQL Injection 방지

모든 쿼리에서 Prepared Statement 사용:

```typescript
// 안전 (Prepared Statement)
const stmt = db.prepare('SELECT * FROM Bible WHERE book = ?')
stmt.get(bookId)

// 위험 (문자열 결합) - 사용하지 않음
db.exec(`SELECT * FROM Bible WHERE book = ${bookId}`)
```

### 파일 시스템 접근

역본 이름이 파일 경로에 사용되므로 검증이 필요합니다:

```typescript
// VERSION_MAP에 정의된 역본만 허용
const validVersions = Object.values(VERSION_MAP)
if (!validVersions.includes(version)) {
  throw new Error('Invalid version')
}
```

---

## 관련 파일

- `src/main/database.ts` - DB 접근 함수
- `src/main/index.ts` - IPC 핸들러
- `src/preload/index.ts` - API 브릿지
- `src/preload/index.d.ts` - 타입 정의
