/**
 * 성경 데이터베이스 텍스트 일괄 치환 스크립트
 *
 * 사용법:
 *   node scripts/replace-bible-text.js <db파일경로> <찾을텍스트> <바꿀텍스트>
 *
 * 예시:
 *   node scripts/replace-bible-text.js resources/bible/공동번역.bdb 하느님 하나님
 */

const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 3) {
    console.log('사용법: node scripts/replace-bible-text.js <db파일경로> <찾을텍스트> <바꿀텍스트>')
    console.log('예시: node scripts/replace-bible-text.js resources/bible/공동번역.bdb 하느님 하나님')
    process.exit(1)
  }

  const [dbPath, searchText, replaceText] = args

  if (!fs.existsSync(dbPath)) {
    console.error(`파일을 찾을 수 없습니다: ${dbPath}`)
    process.exit(1)
  }

  const SQL = await initSqlJs()
  const fileBuffer = fs.readFileSync(dbPath)
  const db = new SQL.Database(fileBuffer)

  // 백업 생성
  const backupPath = dbPath + '.backup'
  fs.copyFileSync(dbPath, backupPath)
  console.log(`백업 파일 생성: ${backupPath}`)

  // 변경 전 개수 확인
  const beforeResult = db.exec(
    `SELECT COUNT(*) FROM Bible WHERE btext LIKE '%${searchText}%'`
  )
  const beforeCount = beforeResult[0]?.values[0][0] || 0
  console.log(`\n변경 전 "${searchText}" 포함 구절: ${beforeCount}개`)

  if (beforeCount === 0) {
    console.log('변경할 내용이 없습니다.')
    db.close()
    return
  }

  // UPDATE 실행
  db.run(`UPDATE Bible SET btext = REPLACE(btext, '${searchText}', '${replaceText}')`)

  // 변경 후 확인
  const afterResult = db.exec(
    `SELECT COUNT(*) FROM Bible WHERE btext LIKE '%${searchText}%'`
  )
  const afterCount = afterResult[0]?.values[0][0] || 0

  const newResult = db.exec(
    `SELECT COUNT(*) FROM Bible WHERE btext LIKE '%${replaceText}%'`
  )
  const newCount = newResult[0]?.values[0][0] || 0

  console.log(`변경 후 "${searchText}" 포함 구절: ${afterCount}개`)
  console.log(`변경 후 "${replaceText}" 포함 구절: ${newCount}개`)

  // 변경된 샘플 확인
  const samples = db.exec(
    `SELECT book, chapter, verse, btext FROM Bible WHERE btext LIKE '%${replaceText}%' LIMIT 3`
  )

  if (samples.length > 0 && samples[0].values.length > 0) {
    console.log('\n변경된 샘플 구절:')
    samples[0].values.forEach((row) => {
      const btext = row[3].substring(0, 60)
      console.log(`  ${row[0]}:${row[1]}:${row[2]} - ${btext}...`)
    })
  }

  // 파일로 저장
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)

  console.log(`\n데이터베이스 저장 완료: ${dbPath}`)
  console.log(`원본 백업: ${backupPath}`)

  db.close()
}

main().catch((err) => {
  console.error('오류 발생:', err.message)
  process.exit(1)
})
