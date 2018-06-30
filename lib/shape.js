import {
    always,
    applyTo,
    both,
    compose,
    cond,
    converge,
    curry,
    difference,
    filter,
    keys,
    identity,
    is,
    isEmpty,
    map,
    merge,
    omit,
    pathSatisfies,
    pick,
    pipe,
    reduce,
    test as regTest,
    T,
    when
} from 'ramda'
import {remover, keeper, impliedRemove} from './prune'
import {onlySpecTransforms, isPlainObj, applyNonTransformProps} from './util'
import alwaysEvolve from './alwaysEvolve'
import evolveSpec from './evolveSpec'
import mapSpec from './mapSpec'


/**
 * Applies transform functions in a given spec to a given object, BUT only the
 * trasnforms that DON'T match key names on the input object are applied.
 * 
 * @func
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object which contains transform functions (only those which do not correspond to keys on the input object will be applied to the input object)
 * @param {Object} input An object which will be passed through the re-shaping transform functions defined by the spec
 * @returns {Object} The input object with the spec transforms applied to it
 * (only those that do not correspond to key names on the input object)
 */
export const applyWholeObjectTransforms = curry((spec, value) =>
    compose(
        mapSpec,
        applyTo(spec),
        pick,
        difference(keys(filter(is(Function), spec))),
        keys
    )(value)
)

const baseShaper = curry((evolver, spec, value) =>
    pipe(
        applyNonTransformProps(spec),
        evolver(filter(is(Function), spec)),
        converge(merge, [
            identity,
            converge(applyTo, [
                when(isEmpty, always(value)),
                applyWholeObjectTransforms(spec)
            ])
        ])
    )(value)
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
 * @param {Object} input An object which will be passed through the re-shaping transform functions defined by the spec
 * @returns {Object} The input object with the spec transforms applied to it
 */
export const shapeLoosely = baseShaper(evolveSpec)

/**
 * Applies a shaping spec to an input object, but will NOT pass through any props unless they are named in the spec.
 * In other words, you're providing it template for creating a brand new object from some raw input.
 *
 * @func
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object whose values are either transform functions or pass-through values to be added to the return object
 * @param {Object} input An object which will be passed through the re-shaping transform functions defined by the spec
 * @returns {Object} The input object with the spec transforms applied to it
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
 * @param {Object} input An object which will be passed through the re-shaping transform functions defined by the spec
 * @returns {Object} The input object with the spec transforms applied to it
 */
export const shapeSuperStrictly = baseShaper(alwaysEvolve)

/**
 * Applies a shaping spec to an input object, but all transform functions will receive the _entire_ input object as input.
 * If you have a prop on your spec that matches the prop name in the input object, the entire input object will still be passed into that transform function.
 *
 * @func
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object whose values are either transform functions or pass-through values to be added to the return object
 * @param {Object} input An object which will be passed through the re-shaping transform functions defined by the spec
 * @returns {Object} The input object with the spec transforms applied to it
 */
export const shapeSuperLoosely = baseShaper(mapSpec)

const pruneOutput = curry(
    (spec, input) =>
        when(
            isPlainObj,
            cond([
                [is(Function), identity],
                [both(isPlainObj, pathSatisfies(regTest(/remove/i), ['shapeyMode'])), remover],
                [both(isPlainObj, pathSatisfies(regTest(/keep/i), ['shapeyMode'])), keeper],
                [both(isPlainObj, pathSatisfies(regTest(/strict/i), ['shapeyMode'])),
                    sp => pipe(impliedRemove(sp), applyNonTransformProps(sp))],
                [isPlainObj, applyNonTransformProps],
                [T, always]
            ])(spec)
        )(input)
)

const applyTransforms = curry(
    (spec, input) => cond([
        [is(Function), identity],
        [both(isPlainObj, pathSatisfies(regTest(/prop/i), ['shapeyTransforms'])),
            pipe(onlySpecTransforms, alwaysEvolve)],
        [both(isPlainObj, pathSatisfies(regTest(/whole/i), ['shapeyTransforms'])),
            pipe(onlySpecTransforms, mapSpec)],
        [isPlainObj, pipe(onlySpecTransforms, shapeLoosely)],
        [T, always]
    ])(spec)(input)
)

/**
 * A single function that selects and applies one of the available re-shaping functions in the shapey library,
 * depending on what you've set the `shapeyMode` prop to in the `spec` you provide as the first argument to this function.
 *
 * Think of it like a case statement in a Redux reducer, however since you most likely _don't_ want to sacrifice
 * the meanining associated with the "type" property to internals of shapey, a prop called "shapeyMode" is used instead.
 *
 * If for some reason you have some prop on the input (the object you're transforming) already named "shapeyMode", um . . . don't.
 *
 * Available modes (case & space in-sensitive):
 *   "loose" - (default) uses `shapeLoosely`, where prop-level transforms are applied if the input object contains a key matching one of your transforms, otherwise the _entire_ input object is fed into your transform functions
 *   "strict" - uses `shapeStrictly`, where _only_ the props named in your spec are included in the output
 *   "super strict" - uses `shapeSuperStrictly`, where _only_ props named in your spec are included in the output _and_ all transform functions are assumed to be prop-level
 *   "super loose" - uses `shapeSuperLoosely`, where all transform functions are fed the _entire_ input object (regardless if a prop name on the input matches the name of one of your transform functions)
 *   "keep" - uses `keepAndShape`, where all the props you name in your spec are kept.
 *   "remove" - uses `removeAndShape`, where all the props you name in your spec are removed.
 *
 *
 * @func
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object whose values are either transform functions or pass-through values to be added to the return object
 * @param {Object} input An object which will be passed through the re-shaping transform functions defined by the spec
 * @returns {Object} The input object with the spec transforms applied to it
 */
const makeShaper = curry((spec, input) => pipe(
    applyTransforms(spec),
    pruneOutput(spec),
    when(isPlainObj, omit(['shapeyTransforms', 'shapeyMode']))
)(input))

/**
 * Applies a list of functions (in sequence) to a single input, passing
 * the transformed output as the input value to the next function in the chain.
 * If a spec object is included in the transforms, the shaper that corresponds
 * to the "shapeyMode" prop is invoked (otherwise `shapeLoosely()` is used).
 * This creates a transform function for the pipeline.
 *
 * @func
 * @sig [a -> b, b -> c, c -> d, ...] -> * -> *
 * @param {Function[]} transforms A list of transform functions
 * @param {*} input The input value to pass through the enhancer pipeline
 * @returns {*} The output of the original input passed through the chain of transform functions
 */
export const shapeline = curry((transforms, input) =>
    reduce((inputObj, fn) => fn(inputObj), input, map(makeShaper, transforms || []))
)

export default makeShaper