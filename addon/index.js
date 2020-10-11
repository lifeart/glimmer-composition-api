import GlimmerComponent from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { tracked as trackedAny } from 'tracked-built-ins';
// import { setComponentManager, capabilities } from '@ember/-internals/glimmer';
import { registerDestructor } from '@ember/destroyable';
import { scheduleOnce } from '@ember/runloop';
import { cached } from 'tracked-toolbox';
import { nodeFor } from 'ember-ref-bucket';

const IS_REF = Symbol("IS_REF");
const EFFECTS = new WeakMap();
let runtimeContext = null;

export function nodeRef(refName) {
  return new NodeTrackedRef(runtimeContext, refName);
}

class NodeTrackedRef {
  constructor(ctx, name) {
    this.ctx = ctx;
    this.name = name;
  }
  get value() {
    return nodeFor(this.ctx, this.name) || null;
  }
}

function addEffect(effect) {
  if (!EFFECTS.has(runtimeContext)) {
    EFFECTS.set(runtimeContext, []);
  }
  EFFECTS.get(runtimeContext).push(effect);
}

function removeEffect(context, effect) {
  const effects = EFFECTS.get(context) || [];
  EFFECTS.set(context, effects.filter((el) => el !== effect));
}

function updateEffects(ctx) {
  (EFFECTS.get(ctx) || []).forEach((eff) => {
    eff.compute();
  })
}
class TrackedEffect {
  constructor(fn) {
    this.fn = fn;
    // @to-do add invalidate function
    this.compute();
  }
  @cached
  get value() {
    return this.fn();
  }
  compute() {
    return this.value;
  }
}

function setRuntimeContext(ctx) {
  runtimeContext = ctx;
}

class TrackedRef {
  [IS_REF] = true;
  constructor(initialValue) {
    this.value = initialValue;
  }
  @tracked value;
  toString() {
    return this.value;
  }
}

const PROXY_LIST = new WeakSet();
const REACTIVE_LIST = new WeakSet();
const RAW_OBJECTS = new WeakSet();

export function markRaw(obj) {
  RAW_OBJECTS.add(obj);
  return obj;
}

export function shallowReactive(obj) {
  return scopedReactive(obj);
}

export function shallowRef(obj) {
  return ref(obj);
}

export function toRaw(obj) {
  // @to-do align / cleanup
  return obj;
}

export function reactive(obj) {
  if (obj === null) {
    return obj;
  }
  if (isReactive(obj)) {
    return obj;
  }
  if (isRef(obj)) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return scopedReactive(obj.map(el=> reactive(el)));
  } else if (typeof obj === 'object' && obj !== null) {
    let clone = {...obj};
    Object.entries(obj).forEach(([key, value])=>{
      if (typeof value === 'object' && value !== null || Array.isArray(value)) {
        clone[key] = reactive(value);
      }
    });
    return scopedReactive(clone);
  }
  return scopedReactive(obj);
}

function scopedReactive(obj) {
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
  if (!obj) {
    return false;
  }
  return obj[IS_REF] || false;
}

export function isProxy(obj) {
  return PROXY_LIST.has(obj);
}

export function isReactive(obj) {
  return obj && REACTIVE_LIST.has(obj);
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
  toString() {
    return this.value;
  }
}

export function toRef(obj, key) {
  if (isRef(obj[key])) {
    return obj[key];
  }
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
  let ctx = runtimeContext;
  const effect = new TrackedEffect(fn);
  addEffect(effect);
  return () => {
    removeEffect(ctx, effect);
  }
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

const DI = new WeakMap();

export function provide(obj, value) {
  DI.set(obj, value);
}

export function inject(obj, defaultValue) {
  return DI.get(obj) || defaultValue;
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
  toString() {
    return this.value;
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
    try {
      setRuntimeContext(this);
      const props = this.setup(this.args) || {};
      Object.entries(props).forEach(([key, value]) => {
        Object.defineProperty(this, key, {
          get() {
            updateEffects(this);
            return unref(value)
          },
          set(value) {
            value.value = value;
          }
        });
      });
    } finally {
      setRuntimeContext(null);
    }

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
