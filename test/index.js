/* eslint max-len: "off" */
import test from 'tape'
import {
    __,
    add,
    always,
    concat,
    compose,
    evolve,
    map,
    head,
    identity,
    ifElse,
    is,
    isNil,
    join,
    length,
    merge,
    omit,
    pick,
    pipe,
    prop,
    replace,
    toPairs,
    filter,
    slice,
    sum,
    test as regTest,
    toString,
    toUpper,
    trim,
    update,
    values,
    when
} from 'ramda'

import shape, {
    alwaysEvolve,
    combine,
    evolveSpec,
    mapSpec,
    mergeSpec,
    keepAndShape,
    removeAndShape,
    shapeStrictly,
    shapeLoosely,
    shapeline
} from '../lib'
    
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
    t.deepEqual(
        mapSpec({
            presidents: {
                foundingFather: jims =>
                    Object.entries(jims.presidents)
                        .filter(([lastName]) => lastName === 'madison')
                        .map(([lastName, firstName]) => `${firstName.replace('i', 'a')}es ${lastName}`)[0],
                peanutFarmer: jims =>
                    Object.entries(jims.presidents)
                        .filter(([lastName]) => lastName === 'carter')
                        .map(([lastName, firstName]) => `${firstName}my ${lastName}`)[0]
            },
            stars: {
                starTrek: jims =>
                    Object.entries(jims.stars)
                        .filter(([lastName]) => lastName === 'kirk')
                        .map(([lastName]) => `james t. ${lastName}`)[0],
                starWars: jims =>
                    Object.entries(jims.stars)
                        .filter(([lastName]) => lastName === 'jones')
                        .map(([lastName]) => `james earl ${lastName}`)[0]
            }
        }, {
            presidents: {
                carter: 'jim',
                harrison: 'jim',
                madison: 'jim',
                monroe: 'jim',
                mckinley: 'jim'
            },
            football: {
                kelly: 'jim',
                otto: 'jim',
                parker: 'jim',
                thorpe: 'jim',
                brown: 'jim',
                carr: 'jim'
            },
            stars: {
                kirk: 'jim',
                jones: 'jim',
                carrey: 'jim',
                stewart: 'jim'
            }
        }), {
            presidents: {
                foundingFather: 'james madison',
                peanutFarmer: 'jimmy carter'
            },
            stars: {
                starTrek: 'james t. kirk',
                starWars: 'james earl jones'
            }
        },
        'is able to recursively re-shape'
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
        alwaysEvolve({bag: when(isNil, always('gym'))})({bo: 'jim'}),
        {bo: 'jim', bag: 'gym'}
    )
    t.deepEqual(
        alwaysEvolve({brown: 'james'}, {
            beam: 'jim',
            belushi: 'jim',
            brown: 'jim',
            bowie: 'jim'
        }), {
            beam: 'jim',
            belushi: 'jim',
            brown: 'james',
            bowie: 'jim'
        },
        'always B jim'
    )
    t.deepEqual(
        alwaysEvolve({bo: identity, bag: always('gym')})(undefined),
        {bo: undefined, bag: 'gym'},
        'gracefully handles nil value'
    )
    t.end()
})

test('"evolveSpec" applies transform functions at the prop-level and passes through non-functions hard-coded onto the spec', (t) => {
    t.deepEqual(
        evolveSpec({lebron: 'james', parsons: slice(0, 3)})({parsons: 'jimmy', lebron: 'jim', dammit: 'jim'}),
        {parsons: 'jim', lebron: 'james', dammit: 'jim'}
    )
    t.deepEqual(
        evolveSpec({
            carrey: 'jim',
            stewart: 'jimmy',
            jones: concat(__, ' earl')
        }, {
            arness: 'james',
            cagney: 'james',
            dean: 'james',
            jones: 'james',
            garner: 'james',
            mason: 'james',
            stewart: 'james'
        }), {
            arness: 'james',
            cagney: 'james',
            dean: 'james',
            jones: 'james earl',
            garner: 'james',
            mason: 'james',
            stewart: 'jimmy'
        },
        'classic jims'
    )
    t.deepEqual(
        evolveSpec({lebron: 'james', parsons: slice(0, 3)})(undefined),
        {},
        'gracefully handles nil value'
    )
    t.end()
})

test('"removeAndShape" removes named props and applies prop-level transforms for props in the spec that are functions', (t) => {
    t.deepEqual(
        removeAndShape({
            caviezel: true,
            fallon: concat(__, 'my'),
            kimmel: concat(__, 'my'),
            curtis: pipe(replace('jim', 'jam'), concat(__, 'ie lee'))
        })({
            caviezel: 'jim',
            fallon: 'jim',
            curtis: 'jim',
            kimmel: 'jim'
        }),
        {fallon: 'jimmy', kimmel: 'jimmy', curtis: 'jamie lee'},
        'passionately removes the christ'
    )
    t.deepEqual(
        removeAndShape({
            caviezel: 'caviezel',
            fallon: 'yup',
            kimmel: null,
            curtis: true
        })({
            caviezel: 'jim',
            fallon: 'jim',
            curtis: 'jim',
            kimmel: 'jim'
        }),
        {fallon: 'jim', kimmel: 'jim'},
        'only accepts props on the spec (in this mode) that are "true" or match the key'
    )
    t.end()
})

test('"keepAndShape" keeps named props and applies prop-level transforms for props in the spec that are functions', (t) => {
    t.deepEqual(
        keepAndShape({
            brown: true,
            kelly: true,
            otto: true,
            parker: true
        })({
            kelly: 'jim',
            otto: 'jim',
            parker: 'jim',
            thorpe: 'jim',
            brown: 'jim',
            carr: 'jim'
        }),
        {brown: 'jim', otto: 'jim', parker: 'jim', kelly: 'jim'},
        'keeps only football jims'
    )
    t.deepEqual(
        keepAndShape({
            brown: 0,
            kelly: null,
            otto: undefined,
            carr: true,
            parker: 'parker'
        })({
            kelly: 'jim',
            otto: 'jim',
            parker: 'jim',
            thorpe: 'jim',
            brown: 'jim',
            carr: 'jim'
        }),
        {carr: 'jim', parker: 'jim'},
        'only accepts props on the spec (in this mode) that are "true" or match the key'
    )
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

test('"shape" allows you to control how the non-transform props are interpreted', (t) => {
    t.deepEqual(
        shape({
            shapeyMode: 'remove',
            duggar: true,
            jones: true,
            page: concat(__, 'my'),
            buffet: concat(__, 'my'),
            keenan: concat(__, 'my')
        }, {
            duggar: 'james',
            jones: 'jim',
            page: 'jim',
            morrison: 'jim',
            buffet: 'jim',
            keenan: 'jim',
            james: 'jim'
        }), {
            page: 'jimmy',
            morrison: 'jim',
            buffet: 'jimmy',
            keenan: 'jimmy',
            james: 'jim'
        },
        'removes evil fundamentalist jims'
    )
    t.deepEqual(
        shape({
            shapeyMode: 'keep',
            broadbent: true,
            mcmanus: true,
            norton: true,
            payton: true,
            phelps: true,
            tavare: true,
            gardner: concat(__, 'my')
        }, {
            broadbent: 'jim',
            carrey: 'jim',
            carr: 'jim',
            gaffigan: 'jim',
            phelps: 'james',
            payton: 'james',
            mcmanus: 'jim',
            norton: 'jim',
            gardner: 'jim',
            tavare: 'jim'
        }), {
            broadbent: 'jim',
            phelps: 'james',
            payton: 'james',
            mcmanus: 'jim',
            norton: 'jim',
            gardner: 'jimmy',
            tavare: 'jim'
        },
        'keeps only harry potter jims'
    )
    t.end()
})
test('"shape" also allows you to control how the transforms are applied', (t) => {
    const propLevelSpec = {
        shapeyTransforms: 'prop',
        summarized: sum,
        pass: ifElse(isNil, always(1), add(1))
    }
    t.deepEqual(
        shape(propLevelSpec, {summarized: [13, 14, 19, 23, 38, 212, 331, 844, 2922, 9333]}),
        {summarized: 13749, pass: 1}
    )
    t.deepEqual(
        shape(propLevelSpec, {pass: 1, summarized: [13749, 23, 3857]}),
        {summarized: 17629, pass: 2}
    )
    const wholeTransformsSpec = {
        shapeyTransforms: 'whole',
        jimmy: compose(map(concat(__, 'my')), pick(['carter', 'fallon', 'kimmel', 'page', 'buffet'])),
        jim: pick(['kirk', 'parsons', 'henson', 'thorpe', 'buffet'])
    }
    t.deepEqual(
        shape(wholeTransformsSpec, {
            parsons: 'jim',
            kirk: 'jim',
            kimmel: 'jim',
            fallon: 'jim',
            carter: 'jim',
            morrison: 'jim',
            buffet: 'jim',
            page: 'jim',
            henson: 'jim',
            thorpe: 'jim',
            curtis: 'jim',
            dean: 'jim',
            jimmy: 'john'
        }), {
            jim: {
                kirk: 'jim',
                parsons: 'jim',
                henson: 'jim',
                thorpe: 'jim',
                buffet: 'jim'
            },
            jimmy: {
                carter: 'jimmy',
                fallon: 'jimmy',
                kimmel: 'jimmy',
                page: 'jimmy',
                buffet: 'jimmy'
            }
        }
    )
    t.end()
})
