import type { I_collins, I_ecdict, I_inflection_type } from './types.ts'

export
type I_exchange_type = 'p' | 'd' | 'i' | '3' | 'r' | 't' | 's' | '0' | '1'

export
interface I_ecdict_raw {
    id: number
    word: string
    sw: string
    phonetic: string | null
    definition: string | null
    translation: string | null
    pos: string | null
    collins: null | I_collins
    oxford: null | 1
    tag: string | null
    bnc: number | null
    frq: number | null
    exchange: string | null
    detail: string | null
    audio: string | null
}

export
function format(record: I_ecdict_raw): I_ecdict {
    const exchange = (record.exchange === null || record.exchange === '')
        ? null
        : Object.fromEntries(
            (record.exchange as string)
                .split('/')
                .map(kv => kv.split(':'))
        ) as Record<I_exchange_type, string | undefined>

    if (exchange !== null && exchange['0'] !== undefined && exchange['1'] === undefined) {
        console.error('has a lemma, no inflection type', record.word, record.exchange)
        // 有的单词有 lemma，但没有 inflection type，比如 `we`
        exchange[0] = undefined
    }

    // 相信数据库，不检查值，只格式化值
    return {
        word: record.word,
        phonetic: record.phonetic || null,
        definition: _strarr_or_null(record.definition),
        translation: _strarr_or_null(record.translation),
        // @ts-ignore: 相信数据库
        collins: record.collins || null, // record.collins: 0, 1, 2, 3, 4, 5
        oxford: record.oxford === 1, // record.oxford: null, 1
        bnc: record.bnc || null,
        frq: record.frq || null,
        lemma: (exchange === null || exchange['0'] === undefined)
            ? null
            : {
                lemma: exchange['0'],
                type: (exchange['1'] as string).split('').map(t => ({
                    p: 'did',
                    d: 'done',
                    i: 'ing',
                    3: 'does',
                    r: 'er',
                    t: 'est',
                    s: 's',
                }[t as 'p' | 'd' | 'i' | '3' | 'r' | 't' | 's']) as I_inflection_type),
            }
        ,
        inflection: (record.exchange === null || record.exchange === '')
            ? {} as Record<I_inflection_type, undefined>
            : Object.fromEntries(
                (record.exchange as string)
                    .split('/')
                    .map(kv => kv.split(':'))
                    .filter(([k]) => {
                        if (['p', 'd', 'i', '3', 'r', 't', 's'].includes(k))
                            return true
                        if (k !== '0' && k !== '1')
                            console.error('invalid inflection type detected', record.word, record.exchange)
                        return false
                    })
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
    const trim = (str: string) => str.trim()
    return str === null ? [] : str.split('\n').map(trim).filter(trim) // 相信数据库
}
