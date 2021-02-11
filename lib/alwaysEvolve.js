import isObject from 'vanillas/isObject'
import curry from 'vanillas/curry'
import merge from 'vanillas/merge'
import {safeSpecTransforms, objectify} from './util'

/**
 * A port of [Ramda's evolve()](http://ramdajs.com/docs/#evolve), but the transforms are _always_ applied regardless if the key/value pair exists in the input object or not.
 *
 * @function
 * @name alwaysEvolve
 * @sig {k: (a -> b)} -> {k: v} -> {k: v}
 * @param {Object} transforms An object whose values may be transform functions that need to be wrapped in try/catch
 * @param {Object} input The input object to pass through prop-level transformations
 * @returns {Object} The modified input object, with any prop-level transforms applied to it
 */
const alwaysEvolve = curry(
  (transforms, input) => {
    const result = {}
    const spec = safeSpecTransforms(transforms)
    const object = objectify(input)
    Object.keys(spec).forEach(key => {
      if (typeof spec[key] === 'function') {
        result[key] = spec[key](object[key])
      } else if (isObject(spec[key])) {
        result[key] = alwaysEvolve(spec[key], object[key])
      } else {
        result[key] = spec[key]
      }
    })
    return merge(input, result)
  }
)

export default alwaysEvolve
