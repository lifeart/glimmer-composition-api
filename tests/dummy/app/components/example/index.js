import { Component, ref, computed, onUnmounted, watchEffect } from 'glimmer-composition-api';

export default class Example extends Component {
  setup(args) {
    const timestamp = ref(Date.now());

    const name = computed(()=>{
      return args.name || 'unknown person';
    });

    const timer = setInterval(()=>{
      timestamp.value = Date.now();
    }, 100);

    let counter = 0;

    let stop = watchEffect(()=> {
      counter++;
      console.log('value: ', timestamp.value);
      if (counter > 10) {
        stop();
      }
    });

    onUnmounted(()=> {
      clearInterval(timer);
    });

    return {
      name,
      timestamp
    }
  }
}
