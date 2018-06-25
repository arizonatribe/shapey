import alwaysEvolve from './alwaysEvolve'
import combine from './combine'
import evolveSpec from './evolveSpec'
import mapSpec from './mapSpec'
import mergeSpec from './mergeSpec'
import makeShaper, {
    keepAndShape,
    removeAndShape,
    shapeline,
    shapeLoosely,
    shapeStrictly,
    shapeSuperLoosely,
    shapeSuperStrictly
} from './shape'

export {
    alwaysEvolve,
    combine,
    evolveSpec,
    makeShaper,
    mapSpec,
    mergeSpec,
    shapeLoosely,
    shapeline,
    shapeStrictly,
    shapeSuperStrictly,
    shapeSuperLoosely,
    keepAndShape,
    removeAndShape
}

export default makeShaper
