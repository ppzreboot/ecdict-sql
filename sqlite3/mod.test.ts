import { assert } from '@std/assert'
import { Database } from '@db/sqlite'
import { make_ecdict_sqlite3 } from './mod.ts'

Deno.test('lookup test', async t => {
    const db = new Database('ecdict.db', {
        readonly: true,
        create: false,
    })
    const lookup = make_ecdict_sqlite3(db)

    await t.step('basic usage', async () => {
        const result = await lookup('hello')
        assert(result !== null)
        assert(result.oxford)
        assert(result.word === 'hello')
    })
    await t.step('Inflection - Past Tense - went', async () => {
        const result = await lookup('wenT')
        assert(result !== null)
        assert(result.word === 'went')
        assert(result.lemma !== null)
        assert(result.lemma.lemma === 'go')
        assert(result.lemma.type[0] === 'did')
        assert(Object.entries(result.inflection).length === 0)
    })
    await t.step('Inflection - 词组 - gEt up', async () => {
        const result = await lookup('get up')
        assert(result !== null)
        assert(result.word === 'get up')
        assert(result.lemma === null)
        assert(Object.entries(result.inflection).length === 0)
    })
    await t.step('Inflection - plural - heroes', async () => {
        const result = await lookup('heRoes')
        assert(result !== null)
        assert(result.word === 'heroes')
        assert(result.lemma !== null)
        assert(result.lemma.lemma === 'hero')
        assert(result.lemma.type[0] === 's')
        assert(Object.entries(result.inflection).length === 0)
    })
    await t.step('Inflection - homograph - tear', async () => {
        const result = await lookup('tear')
        assert(result !== null)
        assert(result.word === 'tear')
        assert(result.lemma === null)
        assert(result.inflection.did === 'tore')
        assert(result.inflection.done === 'torn')
        assert(result.inflection.ing === 'tearing')
        assert(result.inflection.s === 'tears')
        assert(result.inflection.does === 'tears')
        assert(result.inflection.er === undefined)
        assert(result.inflection.est === undefined)
    })
    await t.step('Inflection - found', async () => {
        const result = await lookup('found')
        assert(result !== null)
        assert(result.word === 'found')
        assert(result.lemma !== null)
        assert(result.lemma.lemma === 'find')
        assert(result.lemma.type.includes('did'))
        assert(result.lemma.type.includes('done'))
        assert(result.lemma.type.length === 2)
        assert(result.inflection.did === 'founded')
        assert(result.inflection.done === 'founded')
    })

    await t.step('has lemma, no inflection type', async () => {
        const result = await lookup('we')
        assert(result !== null)
        assert(result.lemma === null)
    })

    await t.step('no definition', async () => {
        const result = await lookup('csv')
        assert(result !== null)
        assert(result.definition.length === 0)
    })

    await t.step('clean up', () => {
        db.close()
    })
})
