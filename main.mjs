const run = (initialState, updaters, renderers) => {
    const canvas = document.querySelector('canvas');

    let state = initialState;

    const tick = (ts) => {
        console.log('tick', ts);
        requestAnimationFrame(tick);

        const ctx = canvas.getContext('2d');

        state = updaters.reduce((state, updater) => updater(state), state);
        renderers.forEach((renderer) => renderer(ctx, state));
    };
    
    requestAnimationFrame(tick);
};

const updateDimensions = (state) => ({
    ...state,
    width: window.innerWidth,
    height: window.innerHeight
});

const background = (ctx, state) => {
    ctx.clearRect(0, 0, state.width, state.height);
};

const stats = (ctx, state) => {
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'black';
    ctx.fillText(`${state.width}x${state.height}`, 10, state.height - 10);
};

const initCanvas = () => {
    const canvas = document.querySelector('canvas');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;    
};

document.addEventListener('resize', initCanvas);

initCanvas();

const initialState = {
    width: window.innerWidth,
    height: window.innerHeight
};

const updaters = [updateDimensions];
const renderers = [background, stats];

run(initialState, updaters, renderers);
