import { device } from './device.mjs';

export const run = (initialState, updaters, renderers) => {
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
