import shape from './shape'

export { default as alwaysEvolve } from './alwaysEvolve'
export { default as combine } from './combine'
export { default as evolveSpec } from './evolveSpec'
export { default as mapSpec } from './mapSpec'
export { default as mergeSpec } from './mergeSpec'
export { remover, removeAndShape, keeper, keepAndShape } from './prune'

export {
  default as shape,
  applyWholeObjectTransforms,
  shapeline,
  shapeLoosely,
  shapeStrictly
} from './shape'

export default shape
