import {apply, curry, curryN, map, max, pluck, reduce, values} from 'ramda'
import {alwaysFunction, safeSpecTransforms} from './util'

/**
 * A port over of [Ramda's applySpec()](http://ramdajs.com/docs/#applySpec),
 * but with a few changes you may or may not see as necessary.
 * (1) This is a shallow spec-mapping function (tired of th 'maximum call stack exceeded' errors)
 * (2) Properly curried so that you can optionally provide args as (spec, input)
 *     rather than only as (spec)(input)
 * (3) It wraps each function in a tryCatch that logs the key name of the transform function that fails.
 *
 * Using applySpec() in the wild and at-scale proved to be one of the hardest Ramda functions to debug.
 * Limiting its functionality and adding console logging doesn't sound like a necessary thing,
 * but when working with Ramda on a full team it may help prevent devs from getting so frustrated
 * that they vote to abandon the library while they're still learning the functional programming paradigm.
 *
 * @func
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object whose values are functions which
 * expect the entire object to be fed in as input.
 * This is identical to the input you'd pass into applySpec()
 * @param {Object} input An object to be mapped over (transformed)
 * @returns {Object} The input object transformed to contain only the props named in the spec
 * (with the corresponding transforms applied at that key)
 */
export default curry((transforms, input) => {
    const spec = map(alwaysFunction, safeSpecTransforms(transforms))
    return curryN(
        reduce(max, 0, pluck('length', values(spec))),
        (...allArgs) => map(fn => apply(fn, allArgs), spec)
    )(input)
})
