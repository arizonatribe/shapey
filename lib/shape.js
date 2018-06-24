import {
    always,
    applyTo,
    compose,
    converge,
    curry,
    difference,
    filter,
    keys,
    identity,
    is,
    isEmpty,
    merge,
    pick,
    pipe,
    reject,
    unless,
    when
} from 'ramda'
import {isPlainObj} from './util'
import alwaysEvolve from './alwaysEvolve'
import evolveSpec from './evolveSpec'
import mapSpec from './mapSpec'

const baseShaper = curry((evolver, spec, value) => pipe(
        unless(isPlainObj, always({})),
        merge,
        applyTo(reject(is(Function), spec)),
        evolver(filter(is(Function), spec)),
        converge(merge, [
            identity,
            converge(applyTo, [
                when(isEmpty, always(value)),
                compose(
                    mapSpec,
                    applyTo(spec),
                    pick,
                    difference(keys(filter(is(Function), spec))),
                    keys
                )
            ])
        ])
    )(value))

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
export const shapeLoosely = baseShaper(evolveSpec)

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
 * Applies a shaping spec to an input object, but will never pass in the input object to a transform
 * when it is unable to find a key on the input object that corresponds to the key of the transform spec.
 * In other words, the transform functions will be applied to the prop on the input object OR to a value of undefined.
 * Write your transform functions accordingly.
 *
 * @func
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object whose values are either transform functions or pass-through values to be added to the return object
 * @returns {Function} A function that is ready to receive an input object and
 * then pick from it to apply the custom shape defined in the spec
 */
export const shapeSuperStrictly = baseShaper(alwaysEvolve)
