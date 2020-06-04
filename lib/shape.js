import { filter, reduce, map } from 'vanillas/curried'
import difference from 'vanillas/difference'
import merge from 'vanillas/merge'
import omit from 'vanillas/omit'
import pick from 'vanillas/pick'
import isEmpty from 'vanillas/isEmpty'
import isObject from 'vanillas/isObject'
import curry from 'vanillas/curry'
import {remover, keeper, impliedRemove} from './prune'
import {onlySpecTransforms, applyNonTransformProps} from './util'
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
export const applyWholeObjectTransforms = curry((spec, value) => {
  const nonFunctionPropNames = difference(
    Object.keys(filter(v => typeof v === 'function', spec)),
    Object.keys(value)
  )
  const nonFunctionProps = pick(nonFunctionPropNames, spec)
  return mapSpec(nonFunctionProps)
})

const baseShaper = curry((evolver, spec, value) => {
  const baseObject = applyNonTransformProps(spec)(value)
  const baseTransformedObject = evolver(onlySpecTransforms(spec))(baseObject)
  const transformFn = applyWholeObjectTransforms(spec)(baseTransformedObject)

  return merge(
    baseTransformedObject,
    transformFn(
      isEmpty(baseTransformedObject) ? value : baseTransformedObject
    )
  )
})

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
export const shapeStrictly = curry((spec, input) => {
  const reshapedObj = shapeLoosely(spec, input)
  return pick(Object.keys(spec), reshapedObj)
})

const pruneOutput = curry(
  (spec, input) => {
    if (!isObject(input)) {
      return input
    }
    if (typeof spec === 'function') {
      return spec(input)
    } else if (isObject(spec)) {
      switch ((spec.shapeyMode || '').toLowerCase()) {
      case 'remove':
        return remover(spec, input)
      case 'keep':
        return keeper(spec, input)
      case 'strict':
        return applyNonTransformProps(spec)(impliedRemove(spec, input))
      default:
        return applyNonTransformProps(spec)(input)
      }
    } else {
      return spec
    }
  }
)

const applyTransforms = curry(
  (spec, input) => {
    if (typeof spec === 'function') {
      return spec(input)
    } else if (isObject(spec)) {
      switch ((spec.shapeyTransforms || '').toLowerCase()) {
      case 'prop':
        return alwaysEvolve(onlySpecTransforms(spec))(input)
      case 'whole':
        return mapSpec(onlySpecTransforms(spec))(input)
      default:
        return shapeLoosely(onlySpecTransforms(spec))(input)
      }
    } else {
      return spec
    }
  }
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
 *   "strict" - uses `shapeStrictly`, where _only_ the props named in your spec are included in the output
 *   "keep" - uses `keepAndShape`, where all the props you name in your spec are kept.
 *   "remove" - uses `removeAndShape`, where all the props you name in your spec are removed.
 *
 * In addition to controlling the mode for Shapey, you can control how the transforms are applied.
 * This is controlled via the reserved prop in your spec called "shapeyTransforms", and the available options for it are:
 *   "prop" - All transforms are applied at the prop-level, regardless if they exist on the input object
 *   "whole" - All transforms are given the _entire_ input object as input
 *   (regardless if a prop matching the name of the transform exists on the input object)
 *
 * @func
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} spec An object whose values are either transform functions or pass-through values to be added to the return object
 * @param {Object} input An object which will be passed through the re-shaping transform functions defined by the spec
 * @returns {Object} The input object with the spec transforms applied to it
 */
const makeShaper = curry((spec, input) => {
  const transformedObj = applyTransforms(spec, input)
  const prunedObj = pruneOutput(spec, transformedObj)
  return isObject(prunedObj)
    ? omit(['shapeyTransforms', 'shapeyMode'], prunedObj)
    : prunedObj
})

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
