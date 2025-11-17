import { assert } from '@std/assert'
import Postgres from 'postgres'
import { make_ECDICT_PGSQL } from './mod.ts'


Deno.test('lookup test', async t => {
    const sql = Postgres(Deno.env.get('PGURI')!)
    const lookup = make_ECDICT_PGSQL(
        sql, 'ecdict', 'ecdict',
    )
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
        assert(result.lemma.type === 'did')
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
        assert(result.lemma.type === 's')
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
    await t.step('clean up', () => {
        sql.end()
    })
})
