import curry from 'vanillas/curry'
import combine from './combine'
import mapSpec from './mapSpec'

/**
 * Similar to [Ramda's applySpec()](http://ramdajs.com/docs/#applySpec), however the spec will be applied and then merged into the original input.
 * Ramda's applySpec() will omit the original input, returning an object containing _only_ the props named in your spec, but this function here will apply the spec and then merge back it into the original input.
 *
 * @function
 * @name mergeSpec
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object whose values are functions which expect the entire object to be fed in as input.  This is identical to the input you'd pass into applySpec()
 * @param {Object} input An object to be mapped over (transformed)
 * @returns {Object} The input object with all the transform functions applied at the named keys
 */
export default curry(
  (spec, value) => combine(value, mapSpec(spec, value))
)
