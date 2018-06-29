import {
    __,
    always,
    compose,
    curry,
    either,
    filter,
    fromPairs,
    is,
    map,
    merge,
    pathEq,
    reject,
    toPairs,
    tryCatch,
    unless,
    when
} from 'ramda'

// eslint-disable-next-line no-console
export const consoler = curry((key, val) => console.error(`\n  Transform on field "${key}" failed\n`, val))

/**
 * This is what you really mean when you're checking to see if something is an Object.
 * Honestly who cares that an Array, Date and RegExp are technically objects too?
 * You were looking for the thing with the curly braces {} right?
 *
 * @func
 * @sig * -> Boolean
 * @param {*} val A value of any type
 * @returns {Boolean} Whether or not the value is an Object
 */
export const isPlainObj = pathEq(['constructor', 'name'], 'Object')

/**
 * Turns any non-Object values into empty objects 
 *
 * @func
 * @sig * -> {k: v}
 * @param {*} val A value of any type
 * @returns {Object} If the original value was an Object, it is returned as-is,
 * otherwise an empty object is returned
 */
export const objectify = unless(isPlainObj, always({}))

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
 * Makes sure a given spec is acceptable for one of the pruning modes (ie, "remove" or "keep"). 
 * Specs in this mode are treated more strictly, meaning the prop must be given
 * a value of "true" or the key and value can be identical.
 * Functions are acceptable values in the spec of course.
 *
 * @func
 * @sig {k: v} -> {k: v}
 * @param {Object} spec A spec to be coerced into an acceptable pruning spec
 * @returns {Object} A spec that is acceptable to be used in pruning mode.
 */
export const makePruningSpec = compose(
    fromPairs,
    filter(([key, val]) => (key === val || val === true || is(Function, val))),
    toPairs,
    objectify
)

/**
 * Takes an non-transform props (non-functions) in a given spec and merges them onto the input object.
 * 
 * @func
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object whose values are either transform functions or pass-through values to be added to the return object
 * @param {Object} input An object which will be passed through the re-shaping transform functions defined by the spec
 * @returns {Object} The input object with only the pass-through props applied to it
 */
export const applyNonTransformProps = curry(
    (spec, value) => (
        [spec, value].every(isPlainObj) ? merge(value, reject(is(Function), spec)) : value
    )
)

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
    toPairs,
    objectify
)
