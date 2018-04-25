import {
    __,
    applySpec,
    applyTo,
    compose,
    converge,
    curry,
    difference,
    evolve,
    filter,
    keys,
    identity,
    is,
    merge,
    pick,
    pipe,
    reject
} from 'ramda'

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
export default curry((spec, value) => pipe(
        merge(reject(is(Function), spec)),
        evolve(filter(is(Function), spec)),
        converge(merge, [
            identity,
            converge(applyTo, [
                identity,
                compose(
                    applySpec,
                    pick(__, spec),
                    difference(keys(filter(is(Function), spec))),
                    keys
                )
            ])
        ])
    )(value))
