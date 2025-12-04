import type { Database } from '@db/sqlite'
import type { I_lookup_from_ECDICT, I_ecdict_raw } from '@ppz-ai/ecdict-common'
import { format } from '@ppz-ai/ecdict-common'

export * from '@ppz-ai/ecdict-common'

export
function make_ecdict_sqlite3(db: Database): I_lookup_from_ECDICT {
    const stmt = db.prepare('select * from stardict where word=?')
    return async function lookup_from_ecdict(word) {
        if (word.length > 100 || word.length === 0)
            return null
        const result = await stmt.get<I_ecdict_raw>(word)
        return result ? format(result) : null // 相信数据库
    }
}
