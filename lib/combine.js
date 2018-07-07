import {all, always, cond, curry, flatten, is, join, mergeAll, sum, T} from 'ramda'
import {isPlainObj} from './util'

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
export default curry((val1, val2) =>
  cond([
    [all(is(Number)), sum],
    [all(is(String)), join('')],
    [all(is(Array)), flatten],
    [all(isPlainObj), mergeAll],
    [T, always(val1)]
  ])([val1, val2])
)
