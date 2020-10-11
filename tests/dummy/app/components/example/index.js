import { Component, ref, onUnmounted } from 'glimmer-composition-api';

export default class Example extends Component {
  setup() {
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
