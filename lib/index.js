import {
    always,
    applySpec,
    applyTo,
    compose,
    cond,
    converge,
    curry,
    difference,
    evolve,
    filter,
    keys,
    identity,
    is,
    isEmpty,
    map,
    merge,
    pathEq,
    pick,
    pipe,
    reduce,
    reject,
    T,
    tryCatch,
    unless,
    when
} from 'ramda'

const isPlainObj = pathEq(['constructor', 'name'], 'Object')

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
        evolve(filter(is(Function), spec)),
        converge(merge, [
            identity,
            converge(applyTo, [
                when(isEmpty, always(value)),
                compose(
                    applySpec,
                    map(fn => tryCatch(fn, always(undefined))),
                    applyTo(spec),
                    pick,
                    difference(keys(filter(is(Function), spec))),
                    keys
                )
            ])
        ])
    )(value))

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
    reduce(
        (inputObj, fn) => cond([
            [isPlainObj, shapeLoosely],
            [is(Function), identity],
            [T, always]
        ])(fn)(inputObj),
        input,
        transforms || []
    )
)

export default shapeLoosely
