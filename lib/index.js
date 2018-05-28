import {
    __,
    all,
    always,
    applySpec,
    applyTo,
    both,
    compose,
    cond,
    converge,
    curry,
    difference,
    evolve,
    filter,
    flatten,
    fromPairs,
    keys,
    identity,
    is,
    isEmpty,
    join,
    map,
    merge,
    mergeAll,
    omit,
    pathEq,
    pathSatisfies,
    pick,
    pipe,
    reduce,
    reject,
    sum,
    T,
    test as regTest,
    toPairs,
    tryCatch,
    unless,
    when
} from 'ramda'

const isPlainObj = pathEq(['constructor', 'name'], 'Object')

// eslint-disable-next-line no-console
export const consoler = curry((key, val) => console.error(`\n  Transform on field "${key}" failed\n`, val))

/**
 * Wraps every function on a given spec in a try/catch that captures exceptions
 * to the console. It also logs the field name whose transform produced the error.
 *
 * @func
 * @sig {k: (a -> b)} -> {k: (a -> b)}
 * @param {Object} spec A justlike[Ramda'sapplySpec(
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

/**
 * This function allows one to blend an object with a clone that is taken
 * through prop transformations. Unlike object mappers/transformers, not every
 * value in the spec need be a function. Non-function values are simply added to
 * the result. If a given value in the spec IS a function however, it will be
 * used to transform OR to create a prop. If the prop specified on the spec
 * exists on the value (object) being mapped, a prop-level transform will be
 * perform (just like [Ramda's evolve()](http://ramdajs.com/docs/#evolve)).
 * But if a prop in the spec doesn't exist in the object and if that prop is a
 * transformer function, then the transformer will be used to create that prop
 * on the resulting object BUT the entire object will be passed into the
 * transform function (just like [Ramda's applySpec()](http://ramdajs.com/docs/#applySpec), rather than just a single prop.
 *
 * @func
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object whose values are either transform functions or pass-through values to be added to the return object
 * @returns {Function} A function that is ready to receive an input object and
 * merge into it the result of applying the provied spec
 */
export const shapeLoosely = curry((spec, value) => pipe(
        unless(isPlainObj, always({})),
        merge,
        applyTo(reject(is(Function), spec)),
        evolve(compose(safeSpecTransforms, filter(is(Function)))(spec)),
        converge(merge, [
            identity,
            converge(applyTo, [
                when(isEmpty, always(value)),
                compose(
                    applySpec,
                    safeSpecTransforms,
                    applyTo(spec),
                    pick,
                    difference(keys(filter(is(Function), spec))),
                    keys
                )
            ])
        ])
    )(value))

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
export const combine = curry((val1, val2) =>
    cond([
        [all(is(Number)), sum],
        [all(is(String)), join('')],
        [all(is(Array)), flatten],
        [all(isPlainObj), mergeAll],
        [T, always(val1)]
    ])([val1, val2])
)

/**
 * Similar to [Ramda's applySpec()](http://ramdajs.com/docs/#applySpec), however
 * the spec will be applied and then merged into the original input.
 * Ramda's applySpec() will omit the original input, returning an object containing _only_
 * the props named in your spec, but this function here will apply the spec
 * and then merge back it into the original input.
 *
 * @func
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object whose values are functions which
 * expect the entire object to be fed in as input.
 * This is identical to the input you'd pass into applySpec()
 * @returns {Function} A function that is ready to receive an input object and
 * merge into it the result of applying the provied spec
 */
export const mergeSpec = curry(
    (spec, value) => converge(combine, [identity, applySpec(safeSpecTransforms(spec))])(value)
)

/**
 * Applies a shaping spec to an input object, but will NOT pass through any props unless they are named in the spec.
 * In other words, you're providing it template for creating a brand new object from some raw input.
 *
 * @func
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object whose values are either transform functions or pass-through values to be added to the return object
 * @returns {Function} A function that is ready to receive an input object and
 * then pick from it to apply the custom shape defined in the spec
 */
export const shapeStrictly = curry((spec, input) => compose(pick(keys(spec)), shapeLoosely(spec))(input))

/**
 * Creates a transform function from either a function, a spec object with field transform functions,
 * or some other type of value. Can also support strict shaping mode
 * (only fields on the spec get created in the final output)
 *
 * @func
 * @sig * -> (a -> b)
 * @param {*} val A spec, a function, or some other value (which will be always returned)
 * @returns {Function} A function that is ready to apply a (potential)
 * transformation on an input value to be provided later
 */
export const makeShaper = cond([
    [is(Function), identity],
    [both(isPlainObj, pathSatisfies(regTest(/strict/i), ['shapeyMode'])), shapeStrictly],
    [isPlainObj, shapeLoosely],
    [T, always]
])

/**
 * Applies a list of functions (in sequence) to a single input, passing
 * the transformed output as the input value to the next function in the chain.
 * If a spec object is included in the transforms, `shapeLooseley()` is invoked
 * on it, to create a transform function for the pipeline.
 *
 * @func
 * @sig [a -> b, b -> c, c -> d, ...] -> * -> *
 * @param {Function[]} transforms A list of transform functions
 * @param {*} input The input value to pass through the enhancer pipeline
 * @returns {*} The output of the original input passed through the chain of
 * transform functions
 */
export const shapeline = curry((transforms, input) =>
    when(isPlainObj, omit(['shapeyMode']))(
        reduce((inputObj, fn) => fn(inputObj), input, map(makeShaper, transforms || []))
    )
)

export default shapeLoosely
