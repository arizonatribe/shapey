import {__, always, compose, curry, either, fromPairs, is, map, pathEq, toPairs, tryCatch, unless, when} from 'ramda'

// eslint-disable-next-line no-console
export const consoler = curry((key, val) => console.error(`\n  Transform on field "${key}" failed\n`, val))

export const isPlainObj = pathEq(['constructor', 'name'], 'Object')

/**
 * If the provided value is NOT a function, transform it into a function that
 * always returns that value 
 *
 * @func
 * @sig * -> (* -> *)
 * @param {*} val A value of any type
 * @returns {Function} If the original value was a function, that function is returned,
 * otherwise a function that always returns the original value is returned
 * function that always returns that value OR 
 */
export const alwaysFunction = unless(is(Function), always)

/**
 * If the provided value is neither an Object nor a Function, transform it into
 * a function that always returns that provided value.
 *
 * @func
 * @sig * -> (* -> *)|{k: v}
 * @param {*} val A value of any type
 * @returns {Function|Object} A function that always returns the provided value
 * OR the original value (if it was already a Function or an Object)
 */
export const makeFunctionUnlessObject = unless(either(is(Function), isPlainObj), always)

/**
 * Wraps every function on a given spec in a try/catch that captures exceptions
 * to the console. It also logs the field name whose transform produced the error.
 *
 * @func
 * @sig {k: (a -> b)} -> {k: (a -> b)}
 * @param {Object} spec An object whose values may be transform functions that
 * need to be wrapped in try/catch
 * @returns {Object} The same spec object but whose functions are
 * safely wrapped in in try/catch handlers
 */
export const safeSpecTransforms = compose(
    fromPairs,
    map(([fieldName, transform]) => ([
        fieldName,
        when(is(Function), tryCatch(__, consoler(fieldName)))(transform)
    ])),
    toPairs
)
