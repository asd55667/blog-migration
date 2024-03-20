import test from 'ava'

import fs from 'node:fs/promises'
import { Category, addCategory, resolveCategory, paginateCategory } from '../src/category.js'
import { walk } from '../src/utils-promises.js'

const categories = new Category()

const root = 'tests/fixture'
await walk(root, async (p) => {
    if ((await fs.lstat(p)).isDirectory()) addCategory(root, p, categories)
})

test('add category', async t => {
    t.snapshot(categories)
})

test('resolve category', async t => {
    const resolved = resolveCategory(['test', 'temp'], categories)

    t.deepEqual(resolved, new Category('test', 'test', 2,
        [new Category('temp', 'temp', 1,)])
    )

})

test('paginate category', async t => {
    paginateCategory(categories, 5)
    // TODO:
    t.deepEqual(1, 1)
})

