import {__, always, applyTo, cond, curry, is, keys, T} from 'ramda'
import {safeSpecTransforms, isPlainObj, objectify} from './util'

/**
 * A port of [Ramda's evolve()](http://ramdajs.com/docs/#evolve), but the
 * transforms are _always_ applied regardless if the key/value pair exists in
 * the input object or not.
 * 
 *
 * @func
 * @sig {k: (a -> b)} -> {k: v} -> {k: v}
 * @param {Object} transforms An object whose values may be transform functions that
 * need to be wrapped in try/catch
 * @param {Object} input The input object to pass through prop-level transformations
 * @returns {Object} The modified input object, with any prop-level transforms
 * applied to it
 */
const alwaysEvolve = curry(
    (transforms, input) => {
        const result = {}
        const spec = safeSpecTransforms(transforms)
        const object = objectify(input)
        keys(spec).forEach(key => {
            result[key] = cond([
                [is(Function), applyTo(object[key])],
                [isPlainObj, alwaysEvolve(__, object[key])],
                [T, always(object[key])]
            ])(spec[key])
        })
        return result
    }
)

export default alwaysEvolve
