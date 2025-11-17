import type Postgres from 'postgres'

export
type I_collins = 1 | 2 | 3 | 4 | 5

type I_exchange_type = 'p' | 'd' | 'i' | '3' | 'r' | 't' | 's' | '0' | '1'

export
type I_inflection_type
    = 'did' // Past Tense
    | 'done' // Past Participle
    | 'ing' // Present Participle
    | 'does' // 3rd Person Singular Present Tense
    | 'er' // Comparative
    | 'est' // Superlative
    | 's' // Plural

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
    lemma: null | {
        lemma: string
        type: string
    }
    inflection: Record<I_inflection_type, string | undefined>
}

export
type I_lookup_from_ECDICT = (word: string) => Promise<I_ecdict | null>

export
function make_ECDICT_PGSQL(
    sql: Postgres.Sql,
    schema_name: string,
    table_name: string,
    new_line_split = '\n',
): I_lookup_from_ECDICT {
    return async function lookup_from_ECDICT(word: string) {
        if (word.length > 100 || word.length === 0)
            return null
        const result = await sql`
            select * from ${sql.unsafe(schema_name)}.${sql.unsafe(table_name)} where word=${word}
        `
        // console.log('result', result[0])
        return result[0] ? format(result[0]) : null // 相信数据库
    }

    function format(record: Postgres.Row): I_ecdict {
        const exchange = record.exchange === null
            ? null
            : Object.fromEntries(
                (record.exchange as string)
                    .split('/')
                    .map(kv => kv.split(':'))
            ) as Record<I_exchange_type, string | undefined>

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
            lemma: (exchange === null || exchange['0'] === undefined)
                ? null
                : {
                    lemma: exchange['0'],
                    type: {
                        p: 'did',
                        d: 'done',
                        i: 'ing',
                        3: 'does',
                        r: 'er',
                        t: 'est',
                        s: 's',
                    }[exchange['1'] as 'p' | 'd' | 'i' | '3' | 'r' | 't' | 's'],
                }
            ,
            inflection: record.exchange === null
                ? {} as Record<I_inflection_type, undefined>
                : Object.fromEntries(
                    (record.exchange as string)
                        .split('/')
                        .map(kv => kv.split(':'))
                        .filter(([k]) => k !== '0' && k !== '1')
                        .map(([k, v]) => [
                            {
                                p: 'did',
                                d: 'done',
                                i: 'ing',
                                3: 'does',
                                r: 'er',
                                t: 'est',
                                s: 's',
                            }[k],
                            v,
                        ])
                ) as Record<I_inflection_type, string>,
        }
    }

    function _strarr_or_null(str: string | null): string[] {
        return str === null ? [] : str.split(new_line_split) // 相信数据库
    }

}
