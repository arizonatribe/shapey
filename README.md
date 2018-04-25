# Shapey

A light, intuitve syntax for re-shaping objects in JavaScript, inspired by [Ramda's](http://ramdajs.com) [evolve](http://ramdajs.com/docs/#evolve) and [applySpec](http://ramdajs.com/docs/#applySpec).

## Installation

```
npm install --save shapey
```

### Usage

```javascript
import shape from 'shapey'

const james = {
    morrison: 'jim',
    hendrix: 'jim',
    carter: 'jim'
}

shape({
    hendrix: concat(__, 'mi'),
    carter: concat(__, 'my'),
    dean: 'james',
    jims: compose(map(join(', ')), toPairs, filter(regTest(/^jim/)))
})(james)

// {
//  morrison: 'jim',
//  hendrix: 'jimmi',
//  carter: 'jimmy'
//  dean: 'james',
//  jims: ['morrison, jim', 'hendrix, jimmi', 'carter, jimmy']
// }
```

### Explanation

To clarify what is happening in that code example:

* Since it isn't mentioned in the spec (the first arg to `shape()`), a prop like `morrison` is passed through untouched.
* Since props like `hendrix` and `carter` ARE specified in the spec, the `concat()` function is passed the original values for those props. This changes the original values to "jimmi" and "jimmy" by concatenating "mi" and "my" onto the original value of "jim".
* Since a prop like `dean` DOESN'T exist on the original object (but is specified on the spec), its corresponding `compose()` function is passed the _entire_ input object (rather than just a single prop from the original input object).
* Any prop (such as `jims`) which is _not_ a function has its value passed through onto the finished result (no operation is performed on the input object for a prop like this).
