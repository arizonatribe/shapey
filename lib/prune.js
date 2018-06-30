import {curry, filter, keys, is, omit, pick, pipe, reject} from 'ramda'
import evolveSpec from './evolveSpec'
import {objectify, makePruningSpec} from './util'

/**
 * Keeps only the props you name in your spec.
 * It is expected (best practice, for conveying intent) that you give a value of `true` for props that you want to keep
 * but _not_ transform (a zipped object - where key and value are both strings of the same name - makes sense too).
 *
 * @func
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object whose values are `true` or match the key name
 * to signal a value to be preserved (as-is) on the output
 * @param {Object} input An object which will be passed through the pruning defined by the spec
 * @returns {Object} The input object with the unnamed props shaved off the output
 */
export const keeper = curry((spec, input) =>
    pipe(
        objectify,
        pipe(makePruningSpec, keys, pick)(spec)
    )(input)
)

/**
 * Keeps only the props you name in your spec. If you provided a function, it is applied at the prop-level.
 * It is expected (best practice, for conveying intent) that you give a value of `true` for props that you want to keep
 * but _not_ transform (a zipped object - where key and value are both strings of the same name - makes sense too).
 * In this mode, if you provide any other type of value it won't be used in the spec.
 * If the prop _doesn't_ exist, you won't see it on the output
 * (use shapeSuperStrictly if you want to see `undefined` for those cases instead).
 *
 * @func
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object whose values are either transform functions or (preferrably)
 * a value of `true` to signal a value to be preserved (as-is) on the output
 * @param {Object} input An object which will be passed through the pruning/re-shaping defined by the spec
 * @returns {Object} The input object with the spec transforms applied to it and
 * unnamed props shaved off the output
 */
export const keepAndShape = curry((spec, input) =>
    pipe(
        keeper(spec),
        evolveSpec(filter(is(Function), spec))
    )(input)
)

/**
 * Removes the props you name in your spec.
 * It is expected (best practice, for conveying intent) that you give a value of `true` for props that you want to remove
 * but _not_ transform (a zipped object - where key and value are both strings of the same name - makes sense too).
 *
 * @func
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object whose values are `true` or match the key name
 * to signal a value to be removed from the output
 * @param {Object} input An object which will be passed through the pruning defined by the spec
 * @returns {Object} The input object with the named props shaved off the output
 */
export const remover = curry((spec, input) =>
    pipe(
        objectify,
        pipe(makePruningSpec, reject(is(Function)), keys, omit)(spec)
    )(input)
)

/**
 * Removes all the props you name in your spec. If you provided a transform function however,
 * it is applied at the prop-level and that prop is (obviously) NOT removed but rather transformed accordingly.
 * It is expected (best practice, for conveying intent) that you give a value of `true` for props you want to remove
 * (a zipped object - where key and value are both strings of the same name - makes sense too).
 * In this mode, if you provide any other type of value it won't be used in the spec.
 *
 * @func
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object whose values are either transform functions or (preferrably)
 * a value of `true` to signal a value to be remove from the output
 * @param {Object} input An object which will be passed through the pruning/re-shaping defined by the spec
 * @returns {Object} The input object with the spec transforms applied to it and
 * name props shaved off the output
 */
export const removeAndShape = curry((spec, input) =>
    pipe(
        remover(spec),
        evolveSpec(filter(is(Function), spec))
    )(input)
)

/**
 * Removes the any props from the input not named in the spec. Doesn't matter
 * what the value types are in the spec: if the key name doesn't exist in the
 * spec, it won't exist in the output.
 *
 * @func
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object
 * @param {Object} input An object which will have any props not named in the spect removed
 * @returns {Object} The input object with the props removed which were not in the spec too
 */
export const impliedRemove = curry((spec, input) => pick(keys(spec), input))
