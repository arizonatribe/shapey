import curry from 'vanillas/curry'
import flatten from 'vanillas/flatten'
import isObject from 'vanillas/isObject'
import merge from 'vanillas/merge'

/**
 * Combines two values of the same type (if it makes sense to combine them).
 * Numbers are summarized, strings and arrays are concatenated together, and
 * true objects are merged (the second value merged on top of the first).
 * In any other case only the first value is returned.
 *
 * @func
 * @sig a -> a -> a
 * @param {*} val1 The base value to be combined with
 * @param {*} val2 The value to combine
 * @returns {*} If the values are of the same type, this represents the combined
 * value of the two of them. Otherwise only the first value is returned
 */
export default curry((val1, val2) => {
  if (typeof val1 === 'number' && typeof val2 === 'number') {
    return val1 + val2
  } else if (typeof val1 === 'string' && typeof val2 === 'string') {
    return [val1, val2].join('')
  } else if (Array.isArray(val1) && Array.isArray(val2)) {
    return flatten([val1, val2])
  } else if (isObject(val1) && isObject(val2)) {
    return merge(val1, val2)
  } else {
    return val1
  }
})
