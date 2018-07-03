import alwaysEvolve from './alwaysEvolve'
import combine from './combine'
import evolveSpec from './evolveSpec'
import mapSpec from './mapSpec'
import mergeSpec from './mergeSpec'
import {remover, removeAndShape, keeper, keepAndShape} from './prune'
import shape, {
    applyWholeObjectTransforms,
    shapeline,
    shapeLoosely,
    shapeStrictly
} from './shape'

export {
    alwaysEvolve,
    applyWholeObjectTransforms,
    combine,
    evolveSpec,
    shape as makeShaper,
    mapSpec,
    mergeSpec,
    shapeLoosely,
    shapeline,
    shapeStrictly,
    keeper,
    keepAndShape,
    remover,
    removeAndShape
}

export default shape
