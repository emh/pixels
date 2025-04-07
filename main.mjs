import { device } from './device.mjs';

const run = (initialState, updaters, renderers) => {
    const canvas = document.querySelector('canvas');
    canvas.width = device.width;
    canvas.height = device.height;

    let state = initialState;

    const tick = (ts) => {
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

const updatePixels = (state) => {
    if (device.mouse.buttons.left) {
        const x = Math.floor(device.mouse.x / state.gridSize);
        const y = Math.floor(device.mouse.y / state.gridSize);
        const pixels = [...state.pixels];

        pixels[x] ||= [];
        pixels[x][y] = true;

        return {
            ...state,
            pixels: [...pixels]
        };
    }

    return state;
};

const renderPixels = (ctx, state) => {
    const size = state.gridSize;

    const drawPixel = (x, y) => {
        ctx.fillStyle = 'blue';
        ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    }
    
    for (let x = 0; x < state.pixels.length; x++) {
        for (let y = 0; y < state.pixels[x]?.length ?? 0; y++) {
            if (state.pixels[x][y]) drawPixel(x, y);
        }
    }
};

const initialState = {
    x: 0,
    y: 0,
    gridSize: 10,
    pixels: []
};

const updaters = [updatePixels];
const renderers = [background, grid, renderPixels, stats];

run(initialState, updaters, renderers);

