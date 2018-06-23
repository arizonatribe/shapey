/* eslint max-len: "off" */
import test from 'tape'
import {
    __,
    always,
    concat,
    compose,
    evolve,
    map,
    head,
    identity,
    is,
    join,
    length,
    merge,
    omit,
    pick,
    pipe,
    prop,
    toPairs,
    filter,
    sum,
    test as regTest,
    toString,
    toUpper,
    trim,
    update,
    values,
    when
} from 'ramda'

import shape, {alwaysEvolve, mapSpec, combine, mergeSpec, shapeStrictly, shapeLoosely, shapeline} from '../lib'
    
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

test('"shapeline" is ideal for an array of specs to be turned into a shapey function pipeline', (t) => {
    const numbers = [3, 4, 9, -3, 82, 274, 1334, 3, 13, 14, 47, 20]
    const transforms = [{
        numbers: nums => nums,
        count: nums => nums.length,
        sum: nums => nums.reduce((tot, num) => tot + num, 0)
    }, {
        type: 'AVERAGE',
        average: s => s.sum / (s.count || 1)
    }]
    t.deepEqual(shapeline(transforms, numbers), {
        type: 'AVERAGE',
        numbers,
        count: 12,
        sum: 1800,
        average: 150
    })
    t.deepEqual(
        shapeline(
            update(1, merge(transforms[1], {shapeyMode: 'strict'}))(transforms),
            numbers
        ),
        {type: 'AVERAGE', average: 150},
        'Optionally can use strict mode in the shapeline'
    )
    t.end()
})

test('"combine" will join, summarize, or merge two values together', (t) => {
    t.equal(combine(1, 2), 3, 'Numeric combination')
    t.equal(combine('foo', 'bar'), 'foobar', 'String combination')
    t.deepEqual(
        combine([1, 2, 3], [4, 5, 6]),
        [1, 2, 3, 4, 5, 6],
        'Array combination'
    )
    t.deepEqual(
        combine({lorem: 'ipsum'}, {dolor: 'sit'}),
        {lorem: 'ipsum', dolor: 'sit'},
        'Object combination'
    )
    t.end()
})

test('"combine" will return the first value when the other value is a different type OR if it makes no sense to combine them', (t) => {
    t.equal(combine(2, 'two'), 2, 'Number and a String?')
    t.equal(combine('two', 2), 'two', 'String and a Number?')
    t.equal(combine(true, false), true, 'Boolean combination?')
    t.equal(combine(false, true), false, 'Boolean combination?')
    t.equal(combine(false, {}), false, 'Boolean and Object?')
    t.deepEqual(combine({}, false), {}, 'Object and Boolean?')
    t.deepEqual(combine([1, 2, 3], {}), [1, 2, 3], 'Array and Object?')
    t.deepEqual(combine({a: 'b'}, [1, 2, 3]), {a: 'b'}, 'Object and Array?')
    t.equal(combine(null, null), null, 'Null')
    t.equal(combine(undefined, null), undefined, 'undefined')
    t.equal(combine(null, undefined), null, 'undefined')
    t.end()
})

test('"mapSpec" applys ONLY the spec shape specified to the input object', (t) => {
    t.deepEqual(
        mapSpec({
            hendrix: pipe(prop('hendrix'), concat(__, 'mi')),
            carter: pipe(prop('carter'), concat(__, 'my'))
        }, inputObj),
        omit(['morrison'], specResult),
        'removes anything from the input object that was NOT in the spec'
    )
    t.deepEqual(
        mapSpec({
            kirk: 'james t.',
            johns: pipe(prop('carter'), concat(__, 'my'))
        }, inputObj),
        {kirk: 'james t.', johns: 'jimmy'},
        'non-function values are always returned, as-is'
    )
    t.end()
})

test('"mergeSpec" blends an object with a copy of itself transformed according to a spec', (t) => {
    t.deepEqual(
        mergeSpec({
            morrison: prop('morrison'),
            hendrix: pipe(prop('hendrix'), concat(__, 'mi')),
            carter: pipe(prop('carter'), concat(__, 'my'))
        }, inputObj),
        specResult
    )
    t.end()
})

test('"mergeSpec" merges new props onto the original object', (t) => {
    t.deepEqual(mergeSpec({
      fullName: compose(join(' '), values, pick(['firstName', 'lastName'])),
      address: pipe(prop('address'), evolve({
        street: trim,
        city: compose(str => str.replace(/(?:^|\s)\S/g, toUpper), trim),
        state: toUpper,
        zip: compose(trim, when(is(Number), toString))
      }))
    }, {
      firstName: 'Montgomery',
      lastName: 'Burns',
      address: {
        street: '1000 Mammon Lane, ',
        city: 'springfield',
        state: 'or',
        zip: 97403
      }
    }), {
      firstName: 'Montgomery',
      lastName: 'Burns',
      address: {
        street: '1000 Mammon Lane,',
        city: 'Springfield',
        state: 'OR',
        zip: '97403'
      },
      fullName: 'Montgomery Burns'
    })
    t.end()
})

test('"alwaysEvolve" applies transform functions regardless if the prop exists in the input object', (t) => {
    t.deepEqual(
        alwaysEvolve({bo: identity, bag: always('gym')})({bo: 'jim'}),
        {bo: 'jim', bag: 'gym'}
    )
    t.deepEqual(
        alwaysEvolve({bo: identity, bag: always('gym')})(undefined),
        {bo: undefined, bag: 'gym'},
        'gracefully handles nil value'
    )
    t.end()
})
