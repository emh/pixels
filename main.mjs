import { device } from './device.mjs';

const run = (initialState, updaters, renderers) => {
    const canvas = document.querySelector('canvas');
    canvas.width = device.width;
    canvas.height = device.height;

    let state = initialState;
    let lastTs = null;

    const tick = (ts) => {
        requestAnimationFrame(tick);

        if (lastTs) {
            const delta = ts - lastTs;
            
            state.fps = Math.round(1000 / delta);
        }

        lastTs = ts;

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
    ctx.fillText(`${device.width}x${device.height} ${state.fps}fps`, 10, device.height - 10);
};

const grid = (ctx, state) => {
    const ox = device.viewport.dx % state.gridSize;
    const oy = device.viewport.dy % state.gridSize;

    ctx.strokeStyle = 'lightgray';
    ctx.beginPath();
        
    for (let x = 0; x < device.width; x += state.gridSize) {
        ctx.moveTo(ox + x + 0.5, 0);
        ctx.lineTo(ox + x + 0.5, device.height);
        ctx.stroke();    
    }

    for (let y = 0; y < device.height; y += state.gridSize) {
        ctx.moveTo(0, oy + y + 0.5);
        ctx.lineTo(device.width, oy + y + 0.5);
        ctx.stroke();    
    }
};

const getPixel = (pixels, x, y) => pixels.get(x)?.get(y) || false;

const setPixel = (pixels, x, y) => {
    const col = pixels.get(x) ?? new Map();
    const newCol = new Map(col);
    newCol.set(y, true);

    const newPixels = new Map(pixels);
    newPixels.set(x, newCol);

    return newPixels;
};

const updatePixels = (state) => {
    if (device.mouse.buttons.left) {
        const x = Math.floor((device.mouse.x - device.viewport.dx) / state.gridSize);
        const y = Math.floor((device.mouse.y - device.viewport.dy) / state.gridSize);

        return {
            ...state,
            pixels: setPixel(state.pixels, x, y)
        };
    }

    return state;
};

const renderPixels = (ctx, state) => {
    const size = state.gridSize;
    const cx = Math.ceil(device.width / size) + 1;
    const cy = Math.ceil(device.height / size) + 1;
    const sx = Math.floor(-1 * device.viewport.dx / size);
    const sy = Math.floor(-1 * device.viewport.dy / size);
    const ex = sx + cx;
    const ey = sy + cy;

    const drawPixel = (x, y) => {
        ctx.fillStyle = 'blue';
        ctx.fillRect(x * size + 1 + device.viewport.dx, y * size + 1 + device.viewport.dy, size - 2, size - 2);
    }
    
    for (let x = sx; x < ex; x++) {
        for (let y = sy; y < ey; y++) {
            if (getPixel(state.pixels, x, y)) drawPixel(x, y);
        }
    }
};

const initialState = {
    x: 0,
    y: 0,
    gridSize: 20,
    pixels: new Map()
};

const updaters = [updatePixels];
const renderers = [background, grid, renderPixels, stats];

run(initialState, updaters, renderers);

