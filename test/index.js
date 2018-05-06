import test from 'tape'
import {__, concat, compose, map, join, toPairs, filter, test as regTest} from 'ramda'
import shape from '../lib'
    
const specResult = {
    morrison: 'jim',
    hendrix: 'jimmi',
    carter: 'jimmy'
}

test('"shape" blends an object with a copy of itself transformed according to a spec', (t) => {
    t.deepEqual(
        shape({
            hendrix: concat(__, 'mi'),
            carter: concat(__, 'my'),
            dean: 'james',
            jims: compose(map(join(', ')), toPairs, filter(regTest(/^jim/)))
        }, {
            morrison: 'jim',
            hendrix: 'jim',
            carter: 'jim'
        }), {
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
    t.end()
})
