import {
    always,
    both,
    compose,
    cond,
    curry,
    identity,
    is,
    map,
    omit,
    pathSatisfies,
    reduce,
    T,
    test as regTest,
    when
} from 'ramda'
import alwaysEvolve from './alwaysEvolve'
import combine from './combine'
import evolveSpec from './evolveSpec'
import mapSpec from './mapSpec'
import mergeSpec from './mergeSpec'
import {shapeLoosely, shapeStrictly, shapeSuperStrictly} from './shape'
import {isPlainObj} from './util'

/**
 * Creates a transform function from either a function, a spec object with field transform functions,
 * or some other type of value. Can also support strict shaping mode
 * (only fields on the spec get created in the final output)
 *
 * @func
 * @sig * -> (a -> b)
 * @param {*} val A spec, a function, or some other value (which will be always returned)
 * @returns {Function} A function that is ready to apply a (potential)
 * transformation on an input value to be provided later
 */
const makeShaper = curry(
    (val, input) => compose(
        when(isPlainObj, omit(['shapeyMode'])),
        cond([
            [is(Function), identity],
            [both(isPlainObj, pathSatisfies(regTest(/strict/i), ['shapeyMode'])), shapeStrictly],
            [both(isPlainObj, pathSatisfies(regTest(/super(.){0,1}strict/i), ['shapeyMode'])), shapeSuperStrictly],
            [isPlainObj, shapeLoosely],
            [T, always]
        ])(val)
    )(input)
)

/**
 * Applies a list of functions (in sequence) to a single input, passing
 * the transformed output as the input value to the next function in the chain.
 * If a spec object is included in the transforms, `shapeLoosely()` is invoked
 * on it, to create a transform function for the pipeline.
 *
 * @func
 * @sig [a -> b, b -> c, c -> d, ...] -> * -> *
 * @param {Function[]} transforms A list of transform functions
 * @param {*} input The input value to pass through the enhancer pipeline
 * @returns {*} The output of the original input passed through the chain of
 * transform functions
 */
const shapeline = curry((transforms, input) =>
    reduce((inputObj, fn) => fn(inputObj), input, map(makeShaper, transforms || []))
)

export {
    alwaysEvolve,
    combine,
    evolveSpec,
    makeShaper,
    mapSpec,
    mergeSpec,
    shapeLoosely,
    shapeline,
    shapeStrictly,
    shapeSuperStrictly
}

export default shapeLoosely
