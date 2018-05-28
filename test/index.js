import test from 'tape'
import {__, concat, compose, map, head, join, length, pipe, toPairs, filter, test as regTest, sum} from 'ramda'
import shape, {shapeStrictly, shapeLoosely, shapeline} from '../lib'
    
const spec = {
    hendrix: concat(__, 'mi'),
    carter: concat(__, 'my'),
    dean: 'james',
    jims: compose(map(join(', ')), toPairs, filter(regTest(/^jim/)))
}
const inputObj = {
    morrison: 'jim',
    hendrix: 'jim',
    carter: 'jim'
}
const specResult = {
    morrison: 'jim',
    hendrix: 'jimmi',
    carter: 'jimmy'
}

test('"shape" blends an object with a copy of itself transformed according to a spec', (t) => {
    t.deepEqual(
        shape(spec, inputObj), {
            ...specResult,
            dean: 'james',
            jims: ['morrison, jim', 'hendrix, jimmi', 'carter, jimmy']
        }
    )
    t.deepEqual(
        shape({morrison: 'Van'}, specResult),
        {...specResult, morrison: 'Van'},
        'can overwrite an existing prop with a hard-coded value'
    )
    t.deepEqual(
        shapeLoosely({morrison: 'Van'}, specResult),
        {...specResult, morrison: 'Van'},
        'default export is synonymous with named export "shapeLoosely"'
    )
    t.end()
})

test('"shapeStrictly" creates a new object from only the fields in the spec', (t) => {
    t.deepEqual(
        shapeStrictly({
            hendrix: jim => `${jim}mi`,
            carter: jim => `${jim}my`,
            dean: 'james',
            jims(allJims) {
                return Object.entries(allJims).reduce(
                    (jimSurnames, [lastName, firstName]) => (
                        !/^jim/.test(firstName || '') ? jimSurnames : [jimSurnames, lastName].filter(Boolean).join(', ')
                    ), '')
            }
        }, inputObj), {
            hendrix: 'jimmi',
            carter: 'jimmy',
            dean: 'james',
            jims: 'morrison, hendrix, carter'
        },
        'creates the shape in the spec (just a take with fluent API using native JS)'
    )
    t.deepEqual(
        shapeStrictly({morrison: 'Van', carter: pipe(head, concat(__, 'ohn'))}, inputObj),
        {morrison: 'Van', carter: 'john'},
        'only named props get through'
    )
    t.end()
})

test('"shape" can take a non-object as input', (t) => {
    const numbers = [3, 4, 9, -3, 82, 274, 1334, 3, 13, 14, 47, 20]
    t.deepEqual(shapeLoosely({sum, count: length}, numbers), {sum: 1800, count: 12})
    t.end()
})

test('"shapeline" applies a list of functions (in sequence) to a single input', (t) => {
    const numbers = [3, 4, 9, -3, 82, 274, 1334, 3, 13, 14, 47, 20]
    const transforms = [
        {sum, count: length},
        s => (s.sum / (s.count || 1))
    ]
    t.deepEqual(shapeline(transforms, numbers), 150)
    t.end()
})
