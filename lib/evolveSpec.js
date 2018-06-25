import {__, applyTo, cond, curry, has, is, keys, T} from 'ramda'
import {safeSpecTransforms, isPlainObj, objectify} from './util'

/**
 * A port of [Ramda's evolve()](http://ramdajs.com/docs/#evolve), but any
 * primitive value or array in the transform spec is wrapped in a function that
 * always returns that value. Any functions already on the transform spec are
 * applied at the prop-level (like evolve() always does) and any objects on the
 * transform spec call the evolver recursively (again, normal behavior for
 * evolve()).
 * In other words, the only difference between this and Ramda's
 * evolve() function is that primitives and array vales are wrapped in an
 * always() function before the spec is fed to evolve() rather than being
 * omitted from the final output.
 *
 * @func
 * @sig {k: (a -> b)} -> {k: v} -> {k: v}
 * @param {Object} transforms An object with transform functions or nested transform
 * functions or primitive vales to be wrapped with a function.
 * @param {Object} input The input object to pass through prop-level transformations
 * @returns {Object} The modified input object, with any prop-level transforms
 * applied to it
 */
const evolveSpec = curry((transforms, input) => {
    const result = {}
    const spec = safeSpecTransforms(transforms)
    const object = objectify(input)
    keys(object).forEach(key => {
        result[key] = cond([
            [is(Function), applyTo(object[key])],
            [isPlainObj, evolveSpec(__, object[key])],
            [T, val => (has(key, spec) ? val : object[key])]
        ])(spec[key])
    })
    return result
})

export default evolveSpec
