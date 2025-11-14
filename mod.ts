import type Postgres from 'postgres'

export
type I_collins = 1 | 2 | 3 | 4 | 5

export
type I_exchange_type = 'p' | 'd' | 'i' | '3' | 'r' | 't' | 's' | '0' | '1'

export
interface I_ecdict {
    word: string
    phonetic: null | string
    definition: string[]
    translation: string[]
    // pos: 
    collins: null | I_collins
    oxford: boolean
    // tag: string[]
    bnc: null | number
    frq: null | number
    exchange: Record<I_exchange_type, string | undefined>
}

export
function make_ECDICT_PGSQL(
    sql: Postgres.Sql,
    schema_name: string,
    table_name: string,
) {
    return async function lookup_from_ECDICT(word: string) {
        if (word.length > 100 || word.length === 0)
            return null
        const result = await sql`
            select * from ${sql.unsafe(schema_name)}.${sql.unsafe(table_name)} where word=${word}
        `
        return format(result[0]) || null // 相信数据库
    }
}

function format(record: Postgres.Row): I_ecdict {
    // 相信数据库，不检查值，只格式化值
    return {
        word: record.word,
        phonetic: record.phonetic,
        definition: _strarr_or_null(record.definition),
        translation: _strarr_or_null(record.translation),
        collins: record.collins,
        oxford: record.oxford === 1,
        bnc: record.bnc,
        frq: record.frq,
        exchange: record.exchange === null
            ? {}
            : (
                Object.fromEntries(
                    (record.exchange as string)
                        .split('/')
                        .map(kv => kv.split(':'))
                )
            )
    }
}

function _strarr_or_null(str: string | null): string[] {
    return str === null ? [] : str.split('\n') // 相信数据库
}
