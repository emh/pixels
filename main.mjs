import { device } from './device.mjs';

const run = (initialState, updaters, renderers) => {
    const canvas = document.querySelector('canvas');
    canvas.width = device.width;
    canvas.height = device.height;

    let state = initialState;

    const tick = (ts) => {
        //console.log('tick', ts);
        requestAnimationFrame(tick);

        if (canvas.width !== device.width || canvas.height !== device.height) {
            canvas.width = device.width;
            canvas.height = device.height;
        }
    
        const ctx = canvas.getContext('2d');

        state = updaters.reduce((state, updater) => updater(state), state);
        renderers.forEach((renderer) => renderer(ctx, state));
    };
    
    requestAnimationFrame(tick);
};

const background = (ctx, state) => {
    ctx.clearRect(0, 0, device.width, device.height);
};

const stats = (ctx, state) => {
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'black';
    ctx.fillText(`(${state.x}, ${state.y}, ${device.width}, ${device.height})`, 10, device.height - 10);
};

const grid = (ctx, state) => {
    ctx.strokeStyle = 'lightgray';
    ctx.beginPath();
        
    for (let x = 0; x < device.width; x += state.gridSize) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, device.height);
        ctx.stroke();    
    }

    for (let y = 0; y < device.height; y += state.gridSize) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(device.width, y + 0.5);
        ctx.stroke();    
    }
};

// const init = () => {
//     const handleResize = () => {
//         const canvas = document.querySelector('canvas');

//         canvas.width = window.innerWidth;
//         canvas.height = window.innerHeight;        
//     };

//     document.addEventListener('resize', handleResize);

//     handleResize();
// };

// init();

const initialState = {
    x: 0,
    y: 0,
    gridSize: 10
};

const updaters = [];
const renderers = [background, grid, stats];

run(initialState, updaters, renderers);

