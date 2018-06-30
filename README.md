# Shapey

A light, intuitve syntax for re-shaping objects in JavaScript, inspired by [Ramda's](http://ramdajs.com) [evolve](http://ramdajs.com/docs/#evolve) and [applySpec](http://ramdajs.com/docs/#applySpec).

## Installation

```
npm install --save shapey
```

### Default Usage

In its default mode, shapey will "loosely" shape an input object. This means the spec shape you provide will _merge_ over the input object.

Additionally, any transform functions you supply as values to the "spec" will be applied to any props of the same name on the input object you supply later. If the name of one or more your transform functions on the spec doesn't match a prop on the input object, shapey will automatically pass the _entire_ input object into that transform function(s).

You can control the automatic behavior of the way transform functions and non-transform props on your spec are handled via the [shapeyMode](#remove-vs-keep-vs-strict-modes) and [shapeyTransforms](#prop-vs-whole-object-transforms) magically reserved props.

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

An alternative to the automatic merging onto the output, you can instead choose that your output will _only_ have the props you name in your spec. This means if a prop in your spec is a string, number, boolean (etc), those values will be hard-coded onto the output. And if a prop in your spec is a Function, it will be _applied_ to your input object before setting that prop on the output.

__Note__: You can either use the `shapeyStrictly()` function directly or set a magic reserved prop on the spec (if you're using the default export from shapey) of `shapeyMode: 'strict'` (that value is _not_ case sensitive).

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

### Remove vs Keep vs Strict modes

In addition to the "strict" mode you can set in your spec for the magic `shapeyMode` reserved prop, you can also set values of either "keep" or "remove". All of these modes are mutually exclusive - since they control how the non-transform props on the spec are applied.

If you opt for "remove" mode, it is expected that all of your non-transform props in the spec are boolean values of `true`. The way it works in Remove mode is any non-transform prop you name is an indication to shapey that you want that prop removed from the output. It will also allow you to set a value that matches the prop name too (if that is how you prefer to write it).

As you might expect for "keep" mode, you should name any props you want to keep (setting a value of `true` or again, a string that matches the prop name).

With "keep" mode, everything prop that is named is kept, and those that aren't named are omitted from the output. With "remove" mode, everything you name (that _isn't_ a transform function) is removed from the output, and anything you don't name is kept intact.

As implied in those descriptions of "remove" and "keep" modes, you can still apply transform functions while you're naming props to keep or remove.

### Prop vs Whole object transforms

Shapey applies the logic (mentioned previously) that transform functions will be
applied to a matching prop on your input object _unless_ that prop does not
exist, in which case the whole input object will be supplied to your prop. What
this allows you to do is create new props that can be derived from existing
ones.

Since this mode isn't always what you want to do, you can change it easily by using the magic "shapeyTransforms" reserved prop in your spec. You can set it to "prop" to always apply prop-level transforms (even if there isn't a matching prop on the input object - keep in mind that means your transform function will receive an input of `undefined`, so write accordingly). Conversely, setting a value of "whole" will always pass the whole input object into your transform functions.

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
