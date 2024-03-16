import test from 'ava'

import fs from 'node:fs/promises'
import { Category, addCategory, resolveCategory } from '../src/category.js'
import { walk } from '../src/utils-promises.js'

const category = new Category()

const root = 'tests/fixture'
await walk(root, async (p) => {
    if ((await fs.lstat(p)).isDirectory()) addCategory(root, p, category)
})

test('add category', async t => {
    t.snapshot(category)
})

test('resolve category', async t => {
    const resolved = resolveCategory(['test', 'temp'], category)

    t.snapshot(resolved)
})


