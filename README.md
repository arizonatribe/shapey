# Shapey

A light, intuitve syntax for re-shaping objects in JavaScript, inspired by [Ramda's](http://ramdajs.com) [evolve](http://ramdajs.com/docs/#evolve) and [applySpec](http://ramdajs.com/docs/#applySpec).

## Installation

```
npm install --save shapey
```

### Default Usage (Loose Shaping)

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

#### Explanation

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

### Shapeline

There is another way to use shaping functions and it is to create a pipeline of them. In this approach you create a list of input functions to be executed in order, transforming the input value and sending that new value as input to the next shaping function.

```
import {shapeline} from 'shapey'

const numbers = [3, 4, 9, -3, 82, 274, 1334, 3, 13, 14, 47, 20]
const transforms = [{
    numbers: nums => nums,
    count: nums => nums.length,
    sum: nums => nums.reduce((tot, num) => tot + num, 0)
}, {
    type: 'AVERAGE',
    average: ({sum, count}) => sum / (count || 1)
}]

shapeline(transforms)(numbers)

// {
// type: 'AVERAGE',
// numbers: [3, 4, 9, -3, 82, 274, 1334, 3, 13, 14, 47, 20],
// count: 12,
// sum: 1800,
// average: 150
// }
```

The list of transform functions to provide can be shapey spec objects or just plain functions that take a value and return a new one. Any shapey spec objec in that list will be turned into a shaping function prior to starting the pipeline.

#### Strict Shaping in the Shapeline

Although the default behvior - when one of the specs in the transforms list is a spec (object) - is to make a `shapeLoosely()` function, you can specify a different shaping mode by setting a prop on the spec called `shapeyMode` to a value of "strict" (case insensitive). This is per spec, and if there are ever any new modes besides "loose" and "strict", this prop will be how you control which to use.

### Combine

A simple curried util function that combines two values of the same type (when it makes sense to combine them)

* Numbers are added together
* Strings or Arrays are concatenated
* Objects are merged (second object is merged onto the first)

When the two values are _not_ of the same type (or not among those rules mentioned above), just the first values is returned instead of attempting to combine anything.

```
import {combine} from 'shapey'

combine(1, 3)
// 4

combine('foo', 'bar')
// foobar

combine([1, 2, 3], [4, 5, 6])
// [1, 2, 3, 4, 5, 6]

combine({lorem: 'ipsum'}, {dolor: 'sit'})
// {lorem: 'ipsum', dolor: 'sit'}

combine({lorem: 'ipsum'})(null)
// {lorem: 'ipsum'}

combine('two', 2)
// two

combine(2, 'two')
// 2

combine([1, 2, 3], {lorem: 'ipsum'})
// [1, 2, 3]

combine({lorem: 'ipsum'}, [1, 2, 3])
// {lorem: 'ipsum'}
```
