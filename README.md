# Shapey

A light, intuitve syntax for re-shaping objects in JavaScript, inspired by [Ramda's](http://ramdajs.com) [evolve](http://ramdajs.com/docs/#evolve) and [applySpec](http://ramdajs.com/docs/#applySpec).

## Installation

```
npm install --save shapey
```

### Default Usage

In its default mode, shapey will "loosely" shape an input object. This means the spec shape you provide will merge over the input object.

```javascript
import shape from 'shapey'

const jimput = {
    morrison: 'jim',
    hendrix: 'jim',
    carter: 'jim',
    world: 'jim'
}

const jimmify = shape({
    hendrix: jim => jim + 'mi',
    carter: jim => jim + 'my',
    dean: 'james',
    world: jim => jim + 'my' + 'eat',
    jims(allJims) {
        return Object.entries(allJims).reduce(
            (jimSurnames, [lastName, firstName]) => (
                !/^jim/.test(firstName || '') ? jimSurnames : [jimSurnames, lastName].filter(Boolean).join(', ')
            ), '')
    }
})

jimmify(jimput)

// {
//  morrison: 'jim',
//  hendrix: 'jimmi',
//  carter: 'jimmy'
//  dean: 'james',
//  world: 'jimmy eat',
//  jims: 'morrison, hendrix, carter'
// }

```

### Explanation

To clarify what is happening in that code example:

* Since it isn't mentioned in the spec (the first arg to `shape()`), a prop like `morrison` is passed through untouched.
* Since props like `hendrix` and `carter` ARE specified in the spec, the `concat()` function is passed the original values for those props. This changes the original values to "jimmi" and "jimmy" by concatenating "mi" and "my" onto the original value of "jim".
* Since a prop like `dean` DOESN'T exist on the original object (but is specified on the spec), its corresponding `compose()` function is passed the _entire_ input object (rather than just a single prop from the original input object).
* Any prop (such as `jims`) which is _not_ a function has its value passed through onto the finished result (no operation is performed on the input object for a prop like this).


### Strict Shaping

Alternatively you can run "strict" shaping on an input object, which means the properties named in your spec will be the _only_ ones included in the final output.

```javascript
import {shapeStrictly} from 'shapey'

const manyJims = {
    morrison: 'jim',
    hendrix: 'jim',
    carter: 'jim',
    gaffigan: 'jim',
    carrey: 'jim',
    beam: 'jim',
    dammit: 'jim',
    slim: 'jim',
    henson: 'jim'
}

const jimsWhoLaugh = shapeStrictly({
    carrey: jim => jim,
    gaffigan: jim => jim
})

jimsWhoLaugh(manyJims)

// {carrey: 'jim', gaffigan: 'jim'}


const jimsWhoRock = shapeStrictly({
    morrison: jim => jim,
    hendrix: jim => jim + 'mi'
})

jimsWhoRock(manyJims)

// {
//  morrison: 'jim',
//  hendrix: 'jimmi'
// }
```

The difference between strict and loose shaping is _only_ the fields in your spec object will appear on the the final output. In loose mode however, all the shaped fields are merged on top of the original input.
