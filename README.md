glimmer-composition-api
==============================================================================

This is VUE Composition API implementation fro Glimmer/Ember, based on @tracked properties.

* repository created as demo, to show flexibility of ember.js tracking system, not recommended for use in production.

Documentation: https://composition-api.vuejs.org/api.html


`glimmer-composition-api` has following named imports:

* `Component` - component class with `setup` function.
* `nodeRef('refName')` - function to create DOM refs, 

```hbs
<!-- in template. -->
<div {{create-ref "refName"}}> </div>
```

... other same stuff


Not implemented:

`readonly`, `watch`, `onUpdated`, `onBeforeUpdate` hooks / functions.

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
