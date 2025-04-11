import { device } from './device.mjs';
import { run } from './engine.mjs';
import { initialState, colors, tools, icons } from './constants.mjs';
import { setPixel, getPixel } from './pixel.mjs';

const paletteRect = () => {
    const width = Math.min(colors.length * 50, device.width - 20);
    const size = width / colors.length;
    const offset = (device.width - width) / 2;

    return {
        top: device.height - (size * 2) - 10,
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

const paletteCoord = () => {
    const { x, y } = device.mouse;
    const rect = paletteRect();
    const size = (rect.right - rect.left) / 8;

    return {
        x: Math.floor((x - rect.left) / size),
        y: Math.floor((y - rect.top) / size)
    };
};

const background = (ctx) => {
    ctx.clearRect(0, 0, device.width, device.height);
};

const stats = (ctx, state) => {
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(device.viewport.dx)}x${Math.floor(device.viewport.dy)} ${state.fps}fps`, device.width - 10, 20);
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

const updatePixels = (state) => {
    if (device.mouse.buttons.left && !insidePalette()) {
        const x = Math.floor((device.mouse.x - device.viewport.dx) / state.gridSize);
        const y = Math.floor((device.mouse.y - device.viewport.dy) / state.gridSize);

        return {
            ...state,
            pixels: setPixel(state.pixels, x, y, state.zoomLevel, state.currentColor)
        };
    }

    return state;
};

const renderQuadPixel = (ctx, pixel, x, y, size) => {
    let color = pixel.nw;

    if (typeof color === 'object') {
        renderQuadPixel(ctx, color, x, y, size / 2);
    } else if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size / 2, size / 2);
    }

    color = pixel.ne;

    if (typeof color === 'object') {
        renderQuadPixel(ctx, color, x + size / 2, y, size / 2);
    } else if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x + size / 2, y, size / 2, size / 2);
    }

    color = pixel.sw;

    if (typeof color === 'object') {
        renderQuadPixel(ctx, color, x, y + size / 2, size / 2);
    } else if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y + size / 2, size / 2, size / 2);
    }

    color = pixel.se;

    if (typeof color === 'object') {
        renderQuadPixel(ctx, color, x + size / 2, y + size / 2, size / 2);
    } else if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x + size / 2, y + size / 2, size / 2, size / 2);
    }
};

const renderPixels = (ctx, state) => {
    const size = state.gridSize;
    const cx = Math.ceil(device.width / size) + 1;
    const cy = Math.ceil(device.height / size) + 1;
    const sx = Math.floor(-1 * device.viewport.dx / size);
    const sy = Math.floor(-1 * device.viewport.dy / size);
    const ex = sx + cx;
    const ey = sy + cy;
        
    for (let x = sx; x < ex; x++) {
        for (let y = sy; y < ey; y++) {
            const color = getPixel(state.pixels, x, y, state.zoomLevel);
            
            if (typeof color === 'object') {
                renderQuadPixel(ctx, color, x * size + 1 + device.viewport.dx, y * size + 1 + device.viewport.dy, size - 2);
            } else if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(x * size + 1 + device.viewport.dx, y * size + 1 + device.viewport.dy, size - 2, size - 2);
            }
        }
    }
};

const setColor = (state) => {
    const coord = paletteCoord();
    const currentColor = state.click && coord.y === 1 && insidePalette() ? colors[coord.x] : state.currentColor;

    return {
        ...state,
        currentColor
    };
};

const zoomIn = (state) => {
    const { x, y } = device.mouse;
    const coord = paletteCoord(x, y);
    let { zoomLevel } = state;

    if (state.click && coord.x === 2 && coord.y === 0 && zoomLevel < 5) {
        const centerX = device.width / 2 - device.viewport.dx;
        const centerY = device.height / 2 - device.viewport.dy;

        zoomLevel++;
        
        device.viewport.dx = device.width / 2 - centerX * 2;
        device.viewport.dy = device.height / 2 - centerY * 2;
    }

    return {
        ...state,
        zoomLevel
    };
};

const zoomOut = (state) => {
    const { x, y } = device.mouse;
    const coord = paletteCoord(x, y);
    let { zoomLevel } = state;

    if (state.click && coord.x === 3 && coord.y === 0 && zoomLevel > 0) {
        const centerX = device.width / 2 - device.viewport.dx;
        const centerY = device.height / 2 - device.viewport.dy;

        zoomLevel--;
        
        device.viewport.dx = device.width / 2 - centerX / 2;
        device.viewport.dy = device.height / 2 - centerY / 2;
    }

    return {
        ...state,
        zoomLevel
    };
};

const drawIcon = (ctx, icon, pixelSize) => {
    for (let y = 0; y < icon.length; y++) {
        for (let x = 0; x < icon[y].length; x++) {
            ctx.fillStyle = icon[y][x] ? 'black' : 'white';
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
    }
};

const palette = (ctx, state) => {
    const rect = paletteRect();
    const size = (rect.right - rect.left) / colors.length;

    ctx.strokeStyle = 'black';

    for (let i = 0; i < colors.length; i++) {
        ctx.save();
        ctx.fillStyle = colors[i];
        ctx.translate(rect.left + i * size, rect.top + size);
        ctx.fillRect(0, 0, size, size);
        ctx.strokeRect(0, 0, size, size);
        if (colors[i] === state.currentColor) ctx.strokeRect(5, 5, size - 10, size - 10);
        ctx.restore();

        const tool = tools[i][state.currentTools[i]];
        const icon = icons[tool];
        const pixelSize = (size / (icon.length + 2));

        ctx.save();
        ctx.fillStyle = 'white';
        ctx.translate(rect.left + i * size, rect.top);
        ctx.fillRect(0, 0, size, size);
        ctx.strokeRect(0, 0, size, size);
        ctx.translate(pixelSize, pixelSize);
        drawIcon(ctx, icon, pixelSize);
        ctx.restore();
    }
};

const detectClick = (state) => {
    const click = !state.wasLeftButtonPressed && device.mouse.buttons.left;

    return {
        ...state,
        click,
        wasLeftButtonPressed: device.mouse.buttons.left
    };
};

const updaters = [detectClick, updatePixels, setColor, zoomIn, zoomOut];
const renderers = [background, grid, renderPixels, palette, stats];

run(initialState, updaters, renderers);
