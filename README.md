glimmer-composition-api
==============================================================================

This is VUE Composition API implementation fro Glimmer/Ember, based on @tracked properties.

Documentation: https://composition-api.vuejs.org/api.html


`glimmer-composition-api` has following named imports:

* `Component` - same API as VUE component

... other same stuff



Compatibility
------------------------------------------------------------------------------

* Ember.js v3.16 or above
* Ember CLI v2.13 or above
* Node.js v10 or above


Installation
------------------------------------------------------------------------------

```
ember install glimmer-composition-api
```


Usage
------------------------------------------------------------------------------

```js
import { Component, ref, onUnmounted } from 'glimmer-composition-api';

export default class HelloWorld extends Component {
  setup(args) {
    const name = ref('Hello');

    const timer = setInterval(()=>{
      name.value = Date.now();
    }, 100);

    onUnmounted(()=> {
      clearInterval(timer);
    });

    return {
      name
    }
  }
}
```

```hbs
<h1>{{this.name}}</h1>
```


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
