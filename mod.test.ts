import { assert } from '@std/assert'
import Postgres from 'postgres'
import { make_ECDICT_PGSQL } from './mod.ts'

const sql = Postgres(Deno.env.get('PGURI')!)

Deno.test('basic usage', async () => {
    const lookup = make_ECDICT_PGSQL(
        sql, 'ecdict', 'ecdict',
    )
    const hello_result = await lookup('hello')
    assert(hello_result !== null)
    assert(hello_result.oxford)
    assert(hello_result.word === 'hello')
    sql.end()
})
