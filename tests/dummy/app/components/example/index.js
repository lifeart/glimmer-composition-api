import { Component, ref, computed, onUnmounted } from 'glimmer-composition-api';

export default class Example extends Component {
  setup(args) {
    const timestamp = ref(Date.now());

    const name = computed(()=>{
      return args.name || 'unknown person';
    });

    const timer = setInterval(()=>{
      timestamp.value = Date.now();
    }, 100);

    onUnmounted(()=> {
      clearInterval(timer);
    });

    return {
      name,
      timestamp
    }
  }
}
