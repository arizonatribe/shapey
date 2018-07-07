import {
  always,
  assoc,
  cond,
  converge,
  curry,
  either,
  equals,
  filter,
  fromPairs,
  identity,
  is,
  mapObjIndexed,
  merge,
  omit,
  pathEq,
  pipe,
  prop,
  reject,
  toPairs,
  tryCatch,
  T,
  test as regTest,
  unless,
  when
} from 'ramda'

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
export const makePruningSpec = pipe(
  objectify,
  toPairs,
  filter(([key, val]) => (key === val || val === true || is(Function, val))),
  fromPairs,
)

/**
 * Filters a spec (object) to only the props that are transform functions. If
 * the input is not an object, this is just an identity function. 
 *
 * @func
 * @sig {k: v} -> {k: v}
 * @param {Object} spec An object whose values (may) be transform functions
 * @returns {Object} The input object with only the props that are functions retained
 */
export const onlySpecTransforms = when(
  isPlainObj,
  pipe(
    toPairs,
    filter(([key, val]) => (key === 'shapeyDebug' || is(Function, val))),
    fromPairs
  )
)

/**
 * Removes the reserved "shapey*" prefixed props from a spec.
 *
 * @func
 * @sig {k: v} -> {k: v}
 * @param {Object} spec A shapey spec to be pruned of magic props
 * @returns {Object} A shapey spec cleaned of magic props
 */
export const removeMagicProps = pipe(
  toPairs,
  reject(([key]) => regTest(/^shapey/i, key)),
  fromPairs
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
    [spec, value].every(isPlainObj) ?
      pipe(removeMagicProps, reject(is(Function)), merge(value))(spec) :
      value
  )
)

/**
 * Logs to the console any failed transform functions, along with the field name
 * and the value that was fed into the transform function. Plus, the exception
 * itself is also logged.
 * 
 * @func
 * @sig String -> * -> Error -> *
 * @param {String} fieldName The field name for the failed transform function
 * @param {Object} value The value that was fed into the transform function
 * @param {Object} exception The exception thrown by the failed transform
 * @returns {undefined}
 */
const defaultErrorHandler = curry((fieldName, value, exception) =>
  // eslint-disable-next-line no-console
  console.error(
    `\n Transform failed on field: "${fieldName}"\n value:`,
    value,
    '\n',
    exception
  )
)

/**
 * A wrapper around an (optional) error handler that the may be passed in as the
 * "shapeyDebug" value. It is curried, but will feed their handler a more
 * standard signature of: (err, field, value)
 *
 * @func
 * @sig ((Error, String, *) -> *) -> String -> * -> Error -> *
 * @param {Function} errHandler The custom error handler provided by the consumer
 * @param {String} fieldName The field name for the failed transform function
 * @param {Object} value The value that was fed into the transform function
 * @param {Object} exception The exception thrown by the failed transform
 * @returns {*} Could be anything, or nothing (it's up to the consumer)
 */
const wrapperForTheirErrorHandler = curry(
  (errHandler, fieldName, value, exception) => errHandler(exception, fieldName, value)
)

/**
 * Wraps every function on a given spec in a try/catch that catches any exception.
 *
 * What it _does_ with the exception is up to the consumer:
 *   - ignores it (if "shapeyDebug" isn't set)
 *   - logs it along with the corresponding field name,
 *     using `console.error` (if "shapeyDebug" is set to `true`)
 *   - uses a custom handler supplied by the consumer as the value for "shapeyDebug" 
 *
 * Note that a custom error handler will be passed the following params (in order):
 *   - The exception
 *   - The field name
 *   - The value that was fed into the transform function
 *
 * @func
 * @sig {k: (a -> b)} -> {k: (a -> b)}
 * @param {Object} spec An object whose values may be transform functions that
 * need to be wrapped in try/catch
 * @returns {Object} The same spec object but whose functions are
 * safely wrapped in in try/catch handlers
 */
export const safeSpecTransforms = pipe(
  objectify,
  converge(assoc('shapeyDebug'), [
    pipe(
      prop('shapeyDebug'),
      cond([
        [equals(true), always(defaultErrorHandler)],
        [is(Function), wrapperForTheirErrorHandler],
        [regTest(/^skip$/i), () => (_, originalValue) => always(originalValue)],
        [T, () => () => always(undefined)]
      ])
    ),
    identity
  ]),
  mapObjIndexed((transform, fieldName, obj) =>
    when(
      is(Function),
      curry((fn, val) => tryCatch(fn, obj.shapeyDebug(fieldName, val))(val))
    )(transform)
  ),
  omit(['shapeyDebug'])
)
