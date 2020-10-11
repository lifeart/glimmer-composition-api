import { Component, ref, nodeRef, computed, reactive, onUnmounted, watchEffect } from 'glimmer-composition-api';

export default class Example extends Component {
  setup(args) {
    const timestamp = ref(Date.now());
    const scope = reactive({
      items: [
        { order: 5 }
      ]
    });

    const name = computed(()=>{
      return args.name || 'unknown person';
    });

    const page = reactive({
      wordCount: computed(() => name.value.length)
    });

    const button = nodeRef('button');

    const timer = setInterval(()=>{
      timestamp.value = Date.now();
      scope.items.forEach((el)=>el.order++);
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
      scope,
      name,
      page,
      timestamp,
      onButtonClick: () => {
        button.value.textContent = 'Clicked!';
        scope.items.push(reactive({order: 42}));
      }
    }
  }
}
