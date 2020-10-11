import GlimmerComponent from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { tracked as trackedAny } from 'tracked-built-ins';
// import { setComponentManager, capabilities } from '@ember/-internals/glimmer';
import { registerDestructor } from '@ember/destroyable';
import { scheduleOnce } from '@ember/runloop';


const IS_REF = Symbol("IS_REF");

let runtimeContext = null;


function setRuntimeContext(ctx) {
  runtimeContext = ctx;
}

class TrackedRef {
  [IS_REF] = true;
  constructor(initialValue) {
    this.value = initialValue;
  }
  @tracked value;
}

const PROXY_LIST = new WeakSet();
const REACTIVE_LIST = new WeakSet();
const RAW_OBJECTS = new WeakSet();

export function markRaw(obj) {
  RAW_OBJECTS.add(obj);
  return obj;
}

export function shallowReactive(obj) {
  // @to-do cleanup diffs
  return reactive(obj);
}

export function shallowRef(obj) {
  return ref(obj);
}

export function toRaw(obj) {
  // @to-do align / cleanup
  return obj;
}

export function reactive(obj) {
  if (RAW_OBJECTS.has(obj)) {
    return obj;
  }
  const result = trackedAny(obj);
  if (Array.isArray(obj)) {
    PROXY_LIST.add(result);
  } else if (typeof obj === 'object' && obj !== null) {
    PROXY_LIST.add(result);
  }
  REACTIVE_LIST.add(result);
  return result;
}

export function isRef(obj) {
  return obj[IS_REF] || false;
}

export function isProxy(obj) {
  return PROXY_LIST.has(obj);
}

export function isReactive(obj) {
  return REACTIVE_LIST.has(obj);
}

export function isReadonly() {
  // @to-do implement readonly
  return false;
}
// class TrackedWrapper {
//    [IS_REF] = true;
//   @tracked _value;
// 	constructor(obj) {
//   	this.value = obj;
//   }
//   get value() {
//   	return this._value;
//   }
//   set value(val) {
//   	this._value = trackedAny(val);
//   }
// }

class TrackedObjectKeyRef {
  [IS_REF] = true;
  constructor(obj, key) {
    this.obj = obj;
    this.key = key;
  }
  get value() {
    return unref(this.obj)[this.key];
  }
  set value(value) {
    unref(this.obj)[this.key] = value;
  }
}

export function toRef(obj, key) {
  return new TrackedObjectKeyRef(obj, key);
}

export function toRefs(state) {
  const result = {};
  const pureState = state;
  Object.keys(unref(state)).forEach((key) => {
    result[key] = toRef(pureState, key);
  });
  return result;
}

export function unref(trackedRef) {
  return isRef(trackedRef) ? trackedRef.value : trackedRef;
}

export function ref(value) {
  return new TrackedRef(value);
}

export function customRef(fn) {
  const ref = new CustomRefWrapper();
  const track = () => { ref.value; };
  const trigger = () => { ref.value++; };
  const { get, set } = fn(track, trigger);
  return new CustomRef({ get, set });
}

// @to-do implement readonly
export function readonly(obj) {
  return reactive(unref(obj));
}


export function watchEffect(fn) {
  // @to-do implement observable
  fn();
  return () => { };
}

export function watch(cond, cb) {
  // @to-do implement watch
  let cbValue = cond();
  cb();
  return () => {
    if (cond() !== cbValue) {
      cb();
    }
  }
}

export function computed(fn) {
  if (typeof fn === 'function') {
    return new CustomRef({ get: fn });
  } else {
    return new CustomRef({ get: fn.get, set: fn.set });
  }
}

export function onMounted(fn) {
  scheduleOnce('afterRender', fn);
}
export function onUpdated() {
  // @to-do implement
}
export function onUnmounted(fn) {
  registerDestructor(runtimeContext, fn);
}

export function inject(name) {
  return this.getOwner(this).container.lookup(`service:${name}`);
}

class CustomRef {
  [IS_REF] = true;
  constructor(desc) {
    this.desc = desc;
  }
  get value() {
    return this.desc.get();
  }
  set value(value) {
    this.desc.set(value);
  }
}

class CustomRefWrapper {
  @tracked value;
}

export class Component extends GlimmerComponent {
  constructor() {
    super(...arguments);
    if (typeof this.setup !== 'function') {
      throw new Error('unable to find setup function on component, imported from "glimmer-composition-api"');
    }
    setRuntimeContext(this);
    const props = this.setup(this.args) || {};
    setRuntimeContext(null);
    Object.entries(props).forEach(([key, value]) => {
      Object.defineProperty(this, key, {
        get() {
          return value.value;
        },
        set(value) {
          value.value = value;
        }
      });
    });
  }
}



// const user = reactive({name: 'foo'});
// //const name = toRef(user, 'name');
// const name = customRef((track, trigger)=>{
//   return {
//    get() {
//      track();
//      return 42;
//    },
//     set() {
//       trigger();
//       return 12;
//     }

//   }
// });
// const state = toRefs(user);
// console.log(user);
// setInterval(()=>{ user.name = Date.now() },1000);
//   return {
//      name: state.name
//   }
