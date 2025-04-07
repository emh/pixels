export const device = {
    width: window.innerWidth, 
    height: window.innerHeight,
    mouse: {
        x: 0,
        y: 0,
        buttons: {
            left: false,
            middle: false,
            right: false
        }
    }
};

window.addEventListener('resize', () => {
    device.width = window.innerWidth;
    device.height = window.innerHeight;
});

const handlePointerEvent = (e) => {
    device.mouse.x = e.x;
    device.mouse.y = e.y;
    device.mouse.buttons.left = (e.buttons & 1) !== 0;
    device.mouse.buttons.right = (e.buttons & 2) !== 0;
    device.mouse.buttons.middle = (e.buttons & 4) !== 0;
};

window.addEventListener('pointermove', handlePointerEvent);
window.addEventListener('pointerdown', handlePointerEvent);
window.addEventListener('pointerup', handlePointerEvent);
window.addEventListener('contextmenu', (e) => e.preventDefault());
