export const device = {
    width: window.innerWidth, 
    height: window.innerHeight
};

window.addEventListener('resize', () => {
    device.width = window.innerWidth;
    device.height = window.innerHeight;
});
