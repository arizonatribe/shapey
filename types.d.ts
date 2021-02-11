/**
 * A port of [Ramda's evolve()](http://ramdajs.com/docs/#evolve), but the transforms are _always_ applied regardless if the key/value pair exists in the input object or not.
 * @param transforms - An object whose values may be transform functions that need to be wrapped in try/catch
 * @param input - The input object to pass through prop-level transformations
 * @returns The modified input object, with any prop-level transforms applied to it
 */
export function alwaysEvolve(transforms: object, input: object): object

/**
 * Combines two values of the same type (if it makes sense to combine them).
 * Numbers are summarized, strings and arrays are concatenated together, and true objects are merged (the second value merged on top of the first).
 * In any other case only the first value is returned.
 * @param val1 - The base value to be combined with
 * @param val2 - The value to combine
 * @returns If the values are of the same type, this represents the combined value of the two of them. Otherwise only the first value is returned
 */
export function combine(val1: string | number | any[] | object, val2: string | number | any[] | object): string | number | any[] | object

/**
 * A port of [Ramda's evolve()](http://ramdajs.com/docs/#evolve), but any primitive value or array in the transform spec is wrapped in a function that always returns that value.
 * Any functions already on the transform spec are applied at the prop-level (like evolve() always does) and any objects on the transform spec call the evolver recursively (again, normal behavior for evolve()).
 * In other words, the only difference between this and Ramda's evolve() function is that primitives and array vales are wrapped in an always() function before the spec is fed to evolve() rather than being omitted from the final output.
 * @param transforms - An object with transform functions or nested transform functions or primitive vales to be wrapped with a function.
 * @param input - The input object to pass through prop-level transformations
 * @returns The modified input object, with any prop-level transforms applied to it
 */
export function evolveSpec(transforms: object, input: object): object

/**
 * A port over of [Ramda's applySpec()](http://ramdajs.com/docs/#applySpec), but with a few changes you may or may not see as necessary.
 * (1) Properly curried so that you can optionally provide args as (spec, input) rather than only as (spec)(input)
 * (2) It wraps each function in a tryCatch that logs the key name of the transform function that fails.
 *
 * Using applySpec() in the wild and at-scale proved to be one of the hardest Ramda functions to debug.
 * Limiting its functionality and adding console logging doesn't sound like a necessary thing, but when working with Ramda on a full team it may help prevent devs from getting so frustrated that they vote to abandon the library while they're still learning the functional programming paradigm.
 * @param spec - An object whose values are functions which expect the entire object to be fed in as input.  This is identical to the input you'd pass into applySpec()
 * @param input - An object to be mapped over (transformed)
 * @returns The input object transformed to contain only the props named in the spec (with the corresponding transforms applied at that key)
 */
export function mapSpec(spec: object, input: object): object

/**
 * Similar to [Ramda's applySpec()](http://ramdajs.com/docs/#applySpec), however the spec will be applied and then merged into the original input.
 * Ramda's applySpec() will omit the original input, returning an object containing _only_ the props named in your spec, but this function here will apply the spec and then merge back it into the original input.
 * @param spec - An object whose values are functions which expect the entire object to be fed in as input.  This is identical to the input you'd pass into applySpec()
 * @param input - An object to be mapped over (transformed)
 * @returns The input object with all the transform functions applied at the named keys
 */
export function mergeSpec(spec: object, input: object): object

/**
 * Keeps only the props you name in your spec.
 * It is expected (best practice, for conveying intent) that you give a value of `true` for props that you want to keep
 * but _not_ transform (a zipped object - where key and value are both strings of the same name - makes sense too).
 * @param spec - An object whose values are `true` or match the key name to signal a value to be preserved (as-is) on the output
 * @param input - An object which will be passed through the pruning defined by the spec
 * @returns The input object with the unnamed props shaved off the output
 */
export function keeper(spec: object, input: object): object

/**
 * Keeps only the props you name in your spec. If you provided a function, it is applied at the prop-level.
 * It is expected (best practice, for conveying intent) that you give a value of `true` for props that you want to keep
 * but _not_ transform (a zipped object - where key and value are both strings of the same name - makes sense too).
 * In this mode, if you provide any other type of value it won't be used in the spec.
 * If the prop _doesn't_ exist, you won't see it on the output
 * (use shapeSuperStrictly if you want to see `undefined` for those cases instead).
 * @param spec - An object whose values are either transform functions or (preferrably) a value of `true` to signal a value to be preserved (as-is) on the output
 * @param input - An object which will be passed through the pruning/re-shaping defined by the spec
 * @returns The input object with the spec transforms applied to it and unnamed props shaved off the output
 */
export function keepAndShape(spec: object, input: object): object

/**
 * Removes the props you name in your spec.
 * It is expected (best practice, for conveying intent) that you give a value of `true` for props that you want to remove
 * but _not_ transform (a zipped object - where key and value are both strings of the same name - makes sense too).
 * @param spec - An object whose values are `true` or match the key name to signal a value to be removed from the output
 * @param input - An object which will be passed through the pruning defined by the spec
 * @returns The input object with the named props shaved off the output
 */
export function remover(spec: object, input: object): object

/**
 * Removes all the props you name in your spec. If you provided a transform function however,
 * it is applied at the prop-level and that prop is (obviously) NOT removed but rather transformed accordingly.
 * It is expected (best practice, for conveying intent) that you give a value of `true` for props you want to remove
 * (a zipped object - where key and value are both strings of the same name - makes sense too).
 * In this mode, if you provide any other type of value it won't be used in the spec.
 * @param spec - An object whose values are either transform functions or (preferrably) a value of `true` to signal a value to be remove from the output
 * @param input - An object which will be passed through the pruning/re-shaping defined by the spec
 * @returns The input object with the spec transforms applied to it and name props shaved off the output
 */
export function removeAndShape(spec: object, input: object): object

/**
 * Removes the any props from the input not named in the spec. Doesn't matter
 * what the value types are in the spec: if the key name doesn't exist in the
 * spec, it won't exist in the output.
 * @param spec - An object
 * @param input - An object which will have any props not named in the spect removed
 * @returns The input object with the props removed which were not in the spec too
 */
export function impliedRemove(spec: object, input: object): object

/**
 * Applies transform functions in a given spec to a given object, BUT only the
 * trasnforms that DON'T match key names on the input object are applied.
 * @param spec - An object which contains transform functions (only those which do not correspond to keys on the input object will be applied to the input object)
 * @param input - An object which will be passed through the re-shaping transform functions defined by the spec
 * @returns The input object with the spec transforms applied to it (only those that do not correspond to key names on the input object)
 */
export function applyWholeObjectTransforms(spec: object, input: object): object

/**
 * This function allows one to blend an object with a clone that is taken through prop transformations. Unlike object mappers/transformers, not every value in the spec need be a function.
 * Non-function values are simply added to the result.
 * If a given value in the spec IS a function however, it will be used to transform OR to create a prop.
 * If the prop specified on the spec exists on the value (object) being mapped, a prop-level transform will be perform (just like [Ramda's evolve()](http://ramdajs.com/docs/#evolve)).
 * But if a prop in the spec doesn't exist in the object and if that prop is a transformer function, then the transformer will be used to create that prop on the resulting object BUT the entire object will be passed into the transform function (just like [Ramda's applySpec()](http://ramdajs.com/docs/#applySpec), rather than just a single prop.
 * @param spec - An object whose values are either transform functions or pass-through values to be added to the return object
 * @param input - An object which will be passed through the re-shaping transform functions defined by the spec
 * @returns The input object with the spec transforms applied to it
 */
export function shapeLoosely(spec: object, input: object): object

/**
 * Applies a shaping spec to an input object, but will NOT pass through any props unless they are named in the spec.
 * In other words, you're providing it template for creating a brand new object from some raw input.
 * @param spec - An object whose values are either transform functions or pass-through values to be added to the return object
 * @param input - An object which will be passed through the re-shaping transform functions defined by the spec
 * @returns The input object with the spec transforms applied to it
 */
export function shapeStrictly(spec: object, input: object): object

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
 * @param spec - An object whose values are either transform functions or pass-through values to be added to the return object
 * @param input - An object which will be passed through the re-shaping transform functions defined by the spec
 * @returns The input object with the spec transforms applied to it
 */
export function makeShaper(spec: object, input: object): object

/**
 * Applies a list of functions (in sequence) to a single input, passing
 * the transformed output as the input value to the next function in the chain.
 * If a spec object is included in the transforms, the shaper that corresponds
 * to the "shapeyMode" prop is invoked (otherwise `shapeLoosely()` is used).
 * This creates a transform function for the pipeline.
 * @param transforms - A list of transform functions
 * @param input - The input value to pass through the enhancer pipeline
 * @returns The output of the original input passed through the chain of transform functions
 */
export function shapeline(transforms: ((...params: any[]) => any)[], input: any): any

/**
 * Turns any non-Object values into empty objects
 * @param val - A value of any type
 * @returns If the original value was an Object, it is returned as-is, otherwise an empty object is returned
 */
export function objectify(val: any): object

/**
 * If the provided value is NOT a function, transform it into a function that always returns that value
 * @param val - A value of any type
 * @returns If the original value was a function, that function is returned, otherwise a function that always returns the original value is returned function that always returns that value OR
 */
export function alwaysFunction(val: any): (...params: any[]) => any

/**
 * If the provided value is neither an Object nor a Function, transform it into a function that always returns that provided value.
 * @param val - A value of any type
 * @returns A function that always returns the provided value OR the original value (if it was already a Function or an Object)
 */
export function makeFunctionUnlessObject(val: any): ((...params: any[]) => any) | object

/**
 * Makes sure a given spec is acceptable for one of the pruning modes (ie, "remove" or "keep").
 * Specs in this mode are treated more strictly, meaning the prop must be given a value of "true" or the key and value can be identical.
 * Functions are acceptable values in the spec of course.
 * @param spec - A spec to be coerced into an acceptable pruning spec
 * @returns A spec that is acceptable to be used in pruning mode.
 */
export function makePruningSpec(spec: object): object

/**
 * Filters a spec (object) to only the props that are transform functions.
 * If the input is not an object, this is just an identity function.
 * @param spec - An object whose values (may) be transform functions
 * @returns The input object with only the props that are functions retained
 */
export function onlySpecTransforms(spec: object): object

/**
 * Removes the reserved "shapey*" prefixed props from a spec.
 * @param spec - A shapey spec to be pruned of magic props
 * @returns A shapey spec cleaned of magic props
 */
export function removeMagicProps(spec: object): object

/**
 * Takes an non-transform props (non-functions) in a given spec and merges them onto the input object.
 * @param spec - An object whose values are either transform functions or pass-through values to be added to the return object
 * @param input - An object which will be passed through the re-shaping transform functions defined by the spec
 * @returns The input object with only the pass-through props applied to it
 */
export function applyNonTransformProps(spec: object, input: object): object

/**
 * Logs to the console any failed transform functions, along with the field name and the value that was fed into the transform function.
 * Plus, the exception itself is also logged.
 * @param fieldName - The field name for the failed transform function
 * @param value - The value that was fed into the transform function
 * @param exception - The exception thrown by the failed transform
 */
export function defaultErrorHandler(fieldName: string, value: object, exception: Error): void

/**
 * A wrapper around an (optional) error handler that the may be passed in as the "shapeyDebug" value.
 * It is curried, but will feed their handler a more standard signature of: (err, field, value)
 * @param errHandler - The custom error handler provided by the consumer
 * @param fieldName - The field name for the failed transform function
 * @param value - The value that was fed into the transform function
 * @param exception - The exception thrown by the failed transform
 * @returns Could be anything, or nothing (it's up to the consumer)
 */
export function wrapperForTheirErrorHandler(errHandler: (...params: any[]) => any, fieldName: string, value: any, exception: Error): any

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
 * @param spec - An object whose values may be transform functions that need to be wrapped in try/catch
 * @returns The same spec object but whose functions are safely wrapped in in try/catch handlers
 */
export function safeSpecTransforms(spec: object): object
