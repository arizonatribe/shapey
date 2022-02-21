# Shapey

<img
  src="https://raw.githubusercontent.com/arizonatribe/shapey/master/assets/styles/logo.png"
  alt="Shapey JS"
  width="250"
  height="162"
  align="right"
/>

A light, intuitve syntax for re-shaping objects in JavaScript, inspired by [Ramda's](http://ramdajs.com) [evolve](http://ramdajs.com/docs/#evolve) and [applySpec](http://ramdajs.com/docs/#applySpec).

## Installation

```
npm install --save shapey
```

## The Basics of Shapey

The simplest way to think of what Shapey does is it allows you to define how to re-shape an object in JavaScript by writing all of those re-shaping changes _as an object_.

So rather than a glut of `if`, `else if`, `else` statements, or a long chain of functions, instead you can define the way you want your object transformed as an object of (mostly) functions. This kind of "object" is referred to in this library (an in other libraries as well) as a __spec__. Shapey will take that object of functions and hard-coded values and turn it into a function that applies those re-shaping operations to the input object you later supply to it.

```javascript
import shape from 'shapey'

// You can import simple tranform functions like these from another file
const yayNay = val => val ? 'Yes' : 'No'
const blankIfNil = val => val == null ? '' val
const trim = str => (str || '').replace(/^\s+|\s+$/, '')
const ensureArray = val => Array.isArray(val) ? val : (val ? [val] : [])
const capitalize = str => (str || '').replace(/(?:^|\s)\S/g, s => s.toUpperCase())
const itsADate = str => (str && typeof str === 'string') ? new Date(str) : new Date()

// Then set them as the values on your spec
const formatUser = shape({
  name: capitalize,
  description: trim,
  isAdmin: yayNay,
  aliases: ensureArray,
  roles: ensureArray,
  lastLogin: itsADate
})

// Finally, apply your spec function to an input object to transform it accordingly
formatUser({
  id: 13234366,
  name: 'james',
  description: 'Lives to work and works to live!  ',
  email: 'james.doe@email.com',
  aliases: null,
  roles: ['admin', 'dev', 'user'],
  lastLogin: null
})

// {
//  id: 13234366,
//  name: 'James',
//  description: 'Lives to work and works to live!',
//  email: 'james.doe@email.com',
//  aliases: [],
//  roles: ['admin', 'dev', 'user'],
//  lastLogin: '2018-07-04T05:49:53.674Z'
// }
```

The reason for a library like this is you often find yourself trying to apply these re-shaping functions via a fluent API of chained functions or maybe a bunch of `if`/`else` blocks, and the more deep you get into these transform operations the harder it becomes to _visualize_ the final output of your output.  The alternative style being proposed with Shapey (as well as its inspiration from a couple of the spec-related functions in [Ramda](http://ramdajs.com)) is to describe your desired output as an object whose keys (may) match prop names on the input you want to re-shape. But the values you set in your "spec" can be functions (or even hard-coded values, when appropriate). When the input is passed into the function created by your Shapey spec, all the props on your input are passed through all the transform functions you defined.

Now you don't _have_ to define functions in your spec that match props in your input object. That is the other side of the coin - when working with Shapey specs - if you define a function in your spec that _doesn't_ correspond to a single prop in your input object, Shapey will assume you want that transform function to create a new prop that is derived from existing props in the input object.

In its default mode, Shapey will apply all the transform operations defined in your spec to the input object, merging those changes into the final output. The additional way that Shapey behaves by default is to match prop names in your spec to prop names in your input object. If you defined a prop in your spec that _doesn't_ exist in your input object (by default) Shapey will create that as a new prop. You may be wondering what it will supply to your transform function if there isn't a matching prop in your input object, but it's quite simple: the entire input object is supplied to your transform function if there isn't a matching prop name on the input object.

Any transform functions you supply as values to the "spec" will be applied to any props of the same name on the input object you supply later. If the name of one or more your transform functions on the spec doesn't match a prop on the input object, shapey will automatically pass the _entire_ input object into that transform function(s).

Again, that is the _default_ behavior and you can alter that by a couple of "magic props" that will signal to Shapey that you want it to behave differently. These are defined in detail later in the docs (the props are [shapeyMode](#remove-vs-keep-vs-strict-modes) and [shapeyTransforms](#prop-vs-whole-object-transforms), and you can jump to the [full description](#shapey-transform-functions-and-shapey-modes) if you want). If - for some strange reason - you have props of those names on your input object . . . don't.

Additionally, there is magic prop called [shapeyDebug](#debugging-transforms) that allows you to catch errors for individual transform functions that fail. 

### A Basic Example

Using the default exported function from Shapey:

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
    world: jim => jim + 'my ' + 'eat',
    jims(allJims) {
        // Break up the whole input object into key-val pairs,
        // and concatenate into a single comma-separated string
        return Object.entries(allJims).reduce(
            (jimSurnames, [lastName, firstName]) => (
                !/^jim/.test(firstName) ?
                    jimSurnames :
                    [jimSurnames, lastName].filter(Boolean).join(', ')
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

## Shapey Transform Functions and Shapey Modes

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

Shapey applies the logic (mentioned previously) that transform functions will be applied to a matching prop on your input object _unless_ that prop does not exist, in which case the whole input object will be supplied to your prop. What this allows you to do is create new props that can be derived from existing ones.

Since this mode isn't always what you want to do, you can change it easily by using the magic "shapeyTransforms" reserved prop in your spec. You can set it to "prop" to always apply prop-level transforms (even if there isn't a matching prop on the input object - keep in mind that means your transform function will receive an input of `undefined`, so write accordingly). Conversely, setting a value of "whole" will always pass the whole input object into your transform functions.

### Debugging Transforms

Executing a bunch of transform functions can be challenging to debug. If one fails, should the whole spec fail too? And how do you tell which one actually failed (among many)? Unfortunately there isn't a perfect answer, however you can provide you own error handler via the `shapeyDebug` magic prop, and Shapey will pass it the exception and the field name, for easier debugging. This means you can leave this prop unset except during troubleshooting sessions OR you can provide an error handling function that's always okay to use (even in production). Also, you can just set `shapeyDebug: true` if you just want to use `console.error` to handle exceptions (it will also log the field name along with the actual exception).

All errors thrown on an individual spec transform function will be caught. Unless you provided a custom handler that returns something else, the value for all failed transforms will be set to `undefined`. This is a tradeoff based on real-world scaling challenges with similar functions like [Ramda's applySpec()](http://ramdajs.com/docs/#applySpec) being used in the Redux `mapStateToProps()` (quite challenging to debug when one selector fails). Frameworks, programming languages, and (sometimes) helper utils are opinionated, and on this topic (catching errors for failed transforms) Shapey is no exception. . . .

Options for `shapeyDebug`:

* `true` - Uses `console.error` to log the transform function (field) that failed, the value that was passed into it, and the actual exception that was caught
* "skip" - Will ignore any transform functions that cause an exception and the original value will be left intact
* `Function` - Your own error handling function, which will receive the following parameters (in this order):
    - The exception that was caught
    - The field name for the transform that failed
    - The value that was fed into the transform function that failed

If you write a custom handler, you can of course, return any value you wish. A common use might be to return the original value, but log the exception, for example something like this:

```javascript

const myCustomHandler = (err, field, value) => {
  /* log the exception itself, and a friendly message */
  someRemoteErrorLoggingFunction(err, `Transform failed on ${field} for value: ${value}`)
  
  /* returns the original value, since the transform failed */
  return value
}

```

Unless you have an idea in mind for your own custom handler, it's recommended that you _don't_ set `shapeyDebug` unless you're actually trying to debug some code that is failing. But if you don't set `shapeyDebug`, keep in mind that although the exception gets caught, nothing is done with it and `undefined` is returned for the transformed prop.

## Full Index of Shapey Functions

Keep in mind that you can (and probably always should) just use the default exported function of Shapey. These functions are all used in that default function and controlled by the reserved `shapeyMode` and `shapeyTransforms` props. However, it might be useful to grab those inner pieces and use them in one-off scenarios as part of your chain of curried, composed functions. Those of you already familiar with the [Ramda](http://ramdajs.com/docs) library are likely using its functions in that manner, so it might make more sense for you to use Shapey in that way, which is why the following functions are provided as named exports:

* [shapeline](#shapeline)
* [alwaysEvolve](#alwaysevolve)
* [combine](#combine)
* [evolveSpec](#evolvespec)
* [mapSpec](#mapspec)
* [mergeSpec](#mergespec)
* [keepAndShape](#keepandshape)
* [removeAndShape](#removeandshape)
* [shapeLoosely](#shapeyloosely)
* [shapeStrictly](#shapeystrictly)

### alwaysEvolve

A port of [Ramda's evolve()](http://ramdajs.com/docs/#evolve), but the transforms are _always_ applied regardless if the key/value pair exists in the input object or not. This means if a prop defined in your spec _doesn't_ exist in the input object, a value of `undefined` will be provided to that prop transform function (so write your transform functions in the spec accordingly).

The reason for a function like this is when you don't have a lot of control over whether your input object is empty or in an upredictable shape (ie, receiving raw data from an API). In those cases, you probably don't want to have the entire input object fed into your prop-level transform function.

```javascript
const jameSomeJims = alwaysEvolve({brown: 'james'})

jameSomeJims({
    beam: 'jim',
    belushi: 'jim',
    bowie: 'jim',
    brown: 'jim'
})

// {
//   beam: 'jim',
//   belushi: 'jim',
//   brown: 'james',
//   bowie: 'jim'
// }
```

### combine

A simple curried util function that combines two values of the same type (when it makes sense to combine them)

* Numbers are added together
* Strings or Arrays are concatenated
* Objects are merged (second object is merged onto the first)

When the two values are _not_ of the same type (or not among those rules mentioned above), just the first values is returned instead of attempting to combine anything.

```javascript
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

### evolveSpec

Another port of [Ramda's evolve()](http://ramdajs.com/docs/#evolve), but it also supports non-function values in the spec. As with Ramda's `evolve()`, the values in your spec will _only_ be applied if those props _also_ exist in your input object (use [alwaysEvolve()](#alwaysevolve) if you want to always apply props regardless if they exist in the input object).

```javascript
const jimsWhoAct = evolveSpec({
    carr: 'jim', 
    carrey: 'jim', 
    stewart: 'jimmy',
    jones: jim => jim + ' earl'
})

const classicJames = {
    arness: 'james',
    cagney: 'james',
    dean: 'james',
    jones: 'james',
    garner: 'james',
    mason: 'james',
    stewart: 'james'
}

jimsWhoAct(classicJames)

// {
//   arness: 'james',
//   cagney: 'james',
//   dean: 'james',
//   jones: 'james earl',
//   garner: 'james',
//   mason: 'james',
//   stewart: 'jimmy'
// }
```

### mapSpec

A port over of [Ramda's applySpec()](http://ramdajs.com/docs/#applySpec), but it is made so that you can pass in both arguments together (rather than thunk style). As with `applySpec()`, non functions are accepted as values for you spec and it supports recursive mapping. Note that - unlike with the evolve functions - _every_ transform function takes the _entire_ input object as input. An additional change was made to this port-over of `applySpec()` (as with the port-overs of `evolve()`) to wrap every transform in a try/catch.

Using `applySpec()` in the wild and at-scale proved to be one of the hardest Ramda functions to debug. While it may not sound necessary to catch errors and log the prop name that failed, I found it important for easing the learning phase for developers who are new to (and on the fence about) functional programming. Since the error tracing was so challenging for myself and a group of developers I collaborated with, it lead to this feature implementation.

This next example demonstrates the recursive nature of the spec mapping (again note that only the fields named in your spec will be present on the output):

```javascript
const starsAndPresidents = mapSpec({
  presidents: {
    foundingFather: jims =>
      Object.entries(jims.presidents)
        .filter(([lastName]) => lastName === 'madison')
        .map(([lastName]) => `james ${lastName}`)[0],

    peanutFarmer: jims =>
      Object.entries(jims.presidents)
        .filter(([lastName]) => lastName === 'carter')
        .map(([lastName, firstName]) => `${firstName}my ${lastName}`)[0]
  },
  stars: {
    starTrek: jims =>
      Object.entries(jims.stars)
        .filter(([lastName]) => lastName === 'kirk')
        .map(([lastName]) => `james t. ${lastName}`)[0],

    starWars: jims =>
      Object.entries(jims.stars)
        .filter(([lastName]) => lastName === 'jones')
        .map(([lastName]) => `james earl ${lastName}`)[0]
  }
})

const assortmentOfJims = {
    presidents: {
        carter: 'jim',
        harrison: 'jim',
        madison: 'jim',
        monroe: 'jim',
        mckinley: 'jim'
    },
    football: {
        kelly: 'jim',
        otto: 'jim',
        parker: 'jim',
        thorpe: 'jim',
        brown: 'jim',
        carr: 'jim'
    },
    stars: {
        kirk: 'jim',
        jones: 'jim',
        carrey: 'jim',
        stewart: 'jim'
    }
}

starsAndPresidents(assortmentOfJims)

// {
//   presidents: {
//     foundingFather: 'james madison',
//     peanutFarmer: 'jimmy carter'
//   },
//   stars: {
//     starTrek: 'james t. kirk',
//     starWars: 'james earl jones'
//   }
// }
```

### mergeSpec

Another function that bears resemblance to  [Ramda's applySpec()](http://ramdajs.com/docs/#applySpec), however it merges the transformed data onto the input, rather than returning only the result of the props defined in the spec.

```javascript
const egggCellent = mergeSpec({
  fullName: compose(join(' '), values, pick(['firstName', 'lastName'])),
  address: pipe(prop('address'), evolve({
    street: trim,
    city: compose(str => str.replace(/(?:^|\s)\S/g, toUpper), trim),
    state: toUpper,
    zip: compose(trim, when(is(Number), toString))
  }))
})

egggCellent({
  firstName: 'Montgomery',
  lastName: 'Burns',
  address: {
    street: '1000 Mammon Lane, ',
    city: 'springfield',
    state: 'or',
    zip: 97403
  }
})

// {
//   firstName: 'Montgomery',
//   lastName: 'Burns',
//   address: {
//     street: '1000 Mammon Lane,',
//     city: 'Springfield',
//     state: 'OR',
//     zip: '97403'
//   },
//   fullName: 'Montgomery Burns'
// }
```

### keepAndShape

This function allows you to define a spec of prop-level transforms _and_ to implicitly remove _all_ props that are not in your spec. Sure, you could do this with [shapeStrictly](#shapestrictly) or even [mapSpec](#mapspec), but it would be a bit clunky with a bunch of identity functions to define props you want to keep but not transform on the final output. In cases like that it would be easier to just set a value of `true` for every prop that you want to keep but _not_ transform. Essentially your spec would look something like this:

```javascript
const makeBaseUserModel = keepAndShape({
    id: true,
    name: capitalize,
    email: true,
    roles: true
})

makeBaseUserModel({
    id: 13453235234,
    name: 'jim doe',
    email: 'jim.doe@email.com',
    roles: ['user', 'admin'],
    dateCreated: '2009-11-05',
    lastLogin: '2018-07-01',
    profile: '/users/images/13453235234',
    address: {
        street: '101 N. Main St.',
        city: 'Phoenix',
        state: 'AZ',
        zip: 85018
    }
})

// {
//  id: 13453235234,
//  name: 'Jim Doe',
//  email: 'jim.doe@email.com',
//  roles: ['user', 'admin'],
// }
```

Nothing too magical going on with `keepAndShape()`, just name the props you want to keep (either by setting a value of `true` or by specifiying a transform function) and everything else will be omitted.

In addition to setting a value of `true` (for props you want to keep), this function will also accept a value that is identical to the key, so something like this would have also worked in that example above:

```javascript
keepAndShape({
    id: 'id',
    name: capitalize,
    email: 'email',
    roles: 'roles'
})
```

### removeAndShape

This function allows you to define a spec of prop-level transforms _and_ to explicitly remove _all_ props that are named in your spec (except for the props in your spec that you are transform functions, of course). This functionality is the opposite of [keepAndShape](#keepandshape) - the only difference being the non-transform props you name in your spec are removed, wherease in `keepAndShape()` the props you name are the _only_ ones kept. The case for using one of these functions over the other is driven by the size of your input object and the number of props you want to remove or to keep. The goal is to reduce the amount of typing you have to perform, so sometimes it's easier to specify a couple props you want to shave off, while sometimes it's easier to name a limited number of props (on a larger input object) that you want to keep.

```javascript
const safeForClientSide = removeAndShape({
    refresh_token: true
})

safeForClientSide({
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkppbSBEb2UiLCJpYXQiOjE1MTYyMzkwMjJ9.xc9_QqQfs5peNl96HVoJ8R-G-QT1G5e2v7ct6_BcwfE',
    expires_in: 60,
    refresh_token: '2eivjoiavoiwe239fja09312s093', 
    name: 'Jim Doe',
    email: 'jim.doe@email.com'
})

// {
//  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkppbSBEb2UiLCJpYXQiOjE1MTYyMzkwMjJ9.xc9_QqQfs5peNl96HVoJ8R-G-QT1G5e2v7ct6_BcwfE',
//  expires_in: 60,
//  name: 'Jim Doe',
//  email: 'jim.doe@email.com'
// }
```

In addition to setting a value of `true` (for props you want to remove), this function will also accept a value that is identical to the key, so something like this would have also worked in that example above:

```javascript
removeAndShape({
    refresh_token: 'refresh_token'
})
```

### shapeLoosely

With this function transforms are applied at the prop-level if a transform matches the name of a prop on the input, and if not, the _whole_ object is fed into the transform function.

### shapeline

There is another way to use shaping functions and it is to create a pipeline of them. In this approach you create a list of input functions to be executed in order, transforming the input value and sending that new value as input to the next shaping function.

```javascript
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
