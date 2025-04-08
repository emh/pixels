import { device } from './device.mjs';
import { run } from './engine.mjs';

const colors = [
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
    'black',
    'white'
];

const paletteRect = () => {
    const width = Math.min(colors.length * 50, device.width - 20);
    const size = width / colors.length;
    const offset = (device.width - width) / 2;

    return {
        top: device.height - size - 10,
        left: offset,
        right: offset + width,
        bottom: device.height - 10
    };
};

const insidePalette = () => {
    const { x, y } = device.mouse;
    const rect = paletteRect();

    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
};

const background = (ctx) => {
    ctx.clearRect(0, 0, device.width, device.height);
};

const stats = (ctx, state) => {
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'right';
    ctx.fillText(`${device.width}x${device.height} ${state.fps}fps`, device.width - 10, 20);
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
    if (device.mouse.buttons.left && !insidePalette()) {
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

const palette = (ctx) => {
    const rect = paletteRect();
    const size = (rect.right - rect.left) / colors.length;

    ctx.strokeStyle = 'black';

    for (let i = 0; i < colors.length; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(rect.left + i * size, rect.top, size, size);
        ctx.strokeRect(rect.left + i * size, rect.top, size, size);
    }
};

const initialState = {
    x: 0,
    y: 0,
    gridSize: 20,
    pixels: new Map()
};

const updaters = [updatePixels];
const renderers = [background, grid, renderPixels, palette, stats];

run(initialState, updaters, renderers);
