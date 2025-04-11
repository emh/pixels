const setQuadPixel = (node, localX, localY, depth, c) => {
    if (depth === 0) return c;
    
    const factor = 2 ** (depth - 1);
    const qx = Math.floor(localX / factor);
    const qy = Math.floor(localY / factor);
    let quadrant;
    
    if (qx === 0 && qy === 0) quadrant = 'nw';
    else if (qx === 1 && qy === 0) quadrant = 'ne';
    else if (qx === 0 && qy === 1) quadrant = 'sw';
    else if (qx === 1 && qy === 1) quadrant = 'se';
    
    let newNode;

    if (node === null) {
        newNode = {};
    } else if (typeof node !== 'object') {
        newNode = { ne: node, nw: node, sw: node, se: node };
    } else {
        newNode = { ...node };
    }
    
    const updatedQuadrant = setQuadPixel(newNode[quadrant], localX % factor, localY % factor, depth - 1, c);

    newNode[quadrant] = updatedQuadrant;
    
    if (newNode.ne === newNode.nw && newNode.ne === newNode.se && newNode.nw === newNode.sw) {
        return newNode.ne;
    }
    
    if (newNode.ne == null && newNode.nw == null && newNode.sw == null && newNode.se == null) {
        return null;
    }
    
    return newNode;
}
  
export const setPixel = (pixels, x, y, z, c) => {
    if (z === 0) {
        const column = pixels.get(x) ?? new Map();
        const newColumn = new Map(column);
    
        if (c) {
            newColumn.set(y, c);
        } else {
            newColumn.delete(y);
        }
    
        const newPixels = new Map(pixels);

        if (newColumn.size > 0) {
            newPixels.set(x, newColumn);
        } else {
            newPixels.delete(x);
        }
    
        return newPixels;
    }

    const factor = 2 ** z;
    const baseX = Math.floor(x / factor);
    const baseY = Math.floor(y / factor);
    const localX = x % factor;
    const localY = y % factor;

    let basePixel = getPixel(pixels, baseX, baseY, 0);

    basePixel = setQuadPixel(basePixel, localX, localY, z, c);

    const column = pixels.get(baseX) ?? new Map();

    const newColumn = new Map(column);

    if (basePixel !== null) {
        newColumn.set(baseY, basePixel);
    } else {
        newColumn.delete(baseY);
    }

    const newPixels = new Map(pixels);

    if (newColumn.size > 0) {
        newPixels.set(baseX, newColumn);
    } else {
        newPixels.delete(baseX);
    }

    return newPixels; 
};

const getQuadPixel = (node, localX, localY, depth) => {
    if (typeof node !== 'object' || node === null || depth === 0) return node;

    const factor = 2 ** (depth - 1);
    const qx = Math.floor(localX / factor);
    const qy = Math.floor(localY / factor);

    let quadrant;

    if (qx === 0 && qy === 0) quadrant = 'nw';
    else if (qx === 1 && qy === 0) quadrant = 'ne';
    else if (qx === 0 && qy === 1) quadrant = 'sw';
    else if (qx === 1 && qy === 1) quadrant = 'se';

    return getQuadPixel(node[quadrant], localX % factor, localY % factor, depth - 1);
};

export const getPixel = (pixels, x, y, z) => {
    if (z === 0) return pixels.get(x)?.get(y);

    const factor = 2 ** z;
    const baseX = Math.floor(x / factor);
    const baseY = Math.floor(y / factor);
    const localX = x % factor;
    const localY = y % factor;

    const basePixel = getPixel(pixels, baseX, baseY, 0);

    return getQuadPixel(basePixel, localX, localY, z);
};
