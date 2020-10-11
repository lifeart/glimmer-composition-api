import { Component, ref, nodeRef, computed, reactive, onMounted, onUnmounted, watchEffect } from 'glimmer-composition-api';


function useMousePosition() {
  const x = ref(0);
  const y = ref(0);

  function update(e) {
    x.value = e.pageX;
    y.value = e.pageY;
  }

  onMounted(() => {
    window.addEventListener("mousemove", update);
  });

  onUnmounted(() => {
    window.removeEventListener("mousemove", update);
  });

  return { x, y };
}

export default class Example extends Component {
  setup(args) {
    const timestamp = ref(Date.now());
    const scope = reactive({
      items: [
        { order: 5 }
      ]
    });

    const nick = ref('lifeart');

    const { x, y } = useMousePosition();

    const name = computed(()=>{
      return args.name || 'unknown person';
    });

    const nickLength = computed(()=>{
      return nick.value.length;
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
      nick,
      nickLength,
      onButtonClick: () => {
        button.value.textContent = 'Clicked!';
        scope.items.push(reactive({order: 42}));
      },
      x, y
    }
  }
}
