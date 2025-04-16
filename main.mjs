import { device } from './device.mjs';
import { run } from './engine.mjs';
import { initialState, colors, tools, icons, TOOLS, CLEAR, ZOOMIN, ZOOMOUT, COLORS, UNDO, REDO } from './constants.mjs';
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
    const size = state.gridSize;
    const sx = Math.floor(-1 * device.viewport.dx / size);
    const sy = Math.floor(-1 * device.viewport.dy / size);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'right';
    ctx.fillText(`${2**state.zoomLevel}x | (${sx}, ${sy}) | ${state.fps}fps`, device.width - 10, 20);
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
    const drawing = device.mouse.buttons.left;
    const erasing = device.mouse.buttons.right;

    if ((drawing || erasing) && !insidePalette()) {
        const undoStack = [...state.undoStack];

        if (state.click) {
            undoStack.push(state.pixels);
        }

        const x = Math.floor((device.mouse.x - device.viewport.dx) / state.gridSize);
        const y = Math.floor((device.mouse.y - device.viewport.dy) / state.gridSize);

        return {
            ...state,
            pixels: setPixel(state.pixels, x, y, state.zoomLevel, drawing ? state.currentColor : null),
            undoStack
        };
    }

    return state;
};

const renderQuadPixel = (ctx, pixel, x, y, size) => {
    const getXY = (q) => {
        switch (q) {
            case 'nw': return { x, y };
            case 'ne': return { x: x + size / 2, y };
            case 'sw': return { x, y: y + size / 2 };
            case 'se': return { x: x + size / 2, y: y + size / 2 };
        }
    };

    ['nw', 'ne', 'sw', 'se'].forEach((q) => {
        const color = pixel[q];
        const { x: qx, y: qy } = getXY(q);

        if (typeof color === 'object' && color !== null) {
            renderQuadPixel(ctx, color, qx, qy, size / 2);
        } else if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(qx, qy, size / 2 + 0.5, size / 2 + 0.5);
        }    
    });
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
            
            if (typeof color === 'object' && color !== null) {
                renderQuadPixel(ctx, color, x * size + device.viewport.dx, y * size + device.viewport.dy, size);
            } else if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(x * size + device.viewport.dx, y * size + device.viewport.dy, size + 0.5, size + 0.5);
            }
        }
    }
};

const setColor = (state) => {
    const coord = paletteCoord();
    const currentColor = state.click && coord.y === COLORS && insidePalette() ? colors[coord.x] : state.currentColor;

    return {
        ...state,
        currentColor
    };
};

const zoomIn = (state) => {
    let { zoomLevel } = state;

    if (zoomLevel < 5) {
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
    let { zoomLevel } = state;

    if (zoomLevel > 0) {
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

const clear = (state) => {
    device.viewport.dx = 0;
    device.viewport.dy = 0;

    return {
        ...state,
        pixels: new Map(),
        zoomLevel: 0
    };
};

const undo = (state) => {
    const undoStack = [...state.undoStack];
    const redoStack = [...state.redoStack];
    let pixels = state.pixels;

    if (undoStack.length > 0) {
        redoStack.push(pixels);
        pixels = undoStack.pop() ?? new Map();
    }

    return {
        ...state,
        undoStack,
        redoStack,
        pixels
    };
};

const redo = (state) => {
    const undoStack = [...state.undoStack];
    const redoStack = [...state.redoStack];
    let pixels = state.pixels;

    if (redoStack.length > 0) {
        undoStack.push(pixels);
        pixels = redoStack.pop() ?? new Map();
    }

    return {
        ...state,
        undoStack,
        redoStack,
        pixels
    };
};

const toolClickHandlers = [
    undo,
    redo,
    zoomIn,
    zoomOut,
    null,
    null,
    clear,
    null
];

const toolClick = (state) => {
    const { x, y } = device.mouse;
    const coord = paletteCoord(x, y);

    if (state.click && coord.y === TOOLS && toolClickHandlers[coord.x]) {
        return toolClickHandlers[coord.x](state);
    }

    return state;
};

const drawIcon = (ctx, icon, pixelSize, color) => {
    for (let y = 0; y < icon.length; y++) {
        for (let x = 0; x < icon[y].length; x++) {
            ctx.fillStyle = icon[y][x] ? color : 'white';
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
    }
};

const isToolDisabled = (state, i) => {
    if (i === UNDO) return state.undoStack.length === 0;
    if (i === REDO) return state.redoStack.length === 0;
    if (i === ZOOMIN) return state.zoomLevel === 5;
    if (i === ZOOMOUT) return state.zoomLevel === 0;
    if (i === CLEAR) return state.pixels.size === 0;

    return false;
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
        ctx.strokeStyle = i >= 4 && i <= 6 ? 'white' : 'black';
        if (colors[i] === state.currentColor) ctx.strokeRect(5, 5, size - 10, size - 10);
        ctx.restore();

        const tool = tools[i][state.currentTools[i]];
        const icon = icons[tool];
        const pixelSize = (size / (icon.length + 2));
        const disabled = isToolDisabled(state, i);

        ctx.save();
        ctx.fillStyle = 'white';
        ctx.translate(rect.left + i * size, rect.top);
        ctx.fillRect(0, 0, size, size);
        ctx.strokeRect(0, 0, size, size);
        ctx.translate(pixelSize, pixelSize);
        drawIcon(ctx, icon, pixelSize, disabled ? 'lightgray' : 'black');
        ctx.restore();
    }
};

const detectClick = (state) => {
    const click = !state.wasLeftButtonPressed && (device.mouse.buttons.left || device.mouse.buttons.right);

    return {
        ...state,
        click,
        wasLeftButtonPressed: (device.mouse.buttons.left || device.mouse.buttons.right)
    };
};

const updaters = [detectClick, updatePixels, setColor, toolClick];
const renderers = [background, grid, renderPixels, palette, stats];

run(initialState, updaters, renderers);
