import { initPixels, setPixel, getPixel } from './pixel.mjs';
import { test, run } from './test_runner.mjs';
import assert from 'node:assert/strict';

test('starts empty', () => {
    let pixels = initPixels();
    assert.equal(pixels.size, 0, 'expect no pixels to start');
});

test('returns undefined for empty pixel', () => {
    let pixels = initPixels();
    
    assert.equal(getPixel(pixels, 0, 0, 0), undefined);
});

test('get/set work', () => {
    let pixels = initPixels();
    
    pixels = setPixel(pixels, 0, 0, 0, 'black');

    assert.equal(getPixel(pixels, 0, 0, 0), 'black');
});

test('setting zoomed in pixel creates a quad', () => {
    let pixels = initPixels();
    pixels = setPixel(pixels, 0, 0, 0, 'black');
    pixels = setPixel(pixels, 0, 0, 1, 'red');

    const pixel = getPixel(pixels, 0, 0, 0);

    assert.deepEqual(pixel, { nw: 'red', ne: 'black', sw: 'black', se: 'black' });
});

test('setting multi-zoomed in pixel creates a quad', () => {
    let pixels = initPixels();
    pixels = setPixel(pixels, 4, 3, 0, 'black');
    pixels = setPixel(pixels, 16, 13, 2, 'red');

    const pixel = getPixel(pixels, 4, 3, 0);

    assert.deepEqual(pixel, { ne: 'black', nw: { ne: 'black', nw: 'black', se: 'black', sw: 'red' }, se: 'black', sw: 'black' });
});

test('setting all 4 quadrants collapses that level', () => {
    let pixels = initPixels();
    pixels = setPixel(pixels, 4, 3, 0, 'red');
    pixels = setPixel(pixels, 16, 13, 2, 'black');
    pixels = setPixel(pixels, 16, 12, 2, 'black');
    pixels = setPixel(pixels, 17, 12, 2, 'black');
    pixels = setPixel(pixels, 17, 13, 2, 'black');

    const pixel = getPixel(pixels, 4, 3, 0);

    assert.deepEqual(pixel, { ne: 'red', nw: 'black', se: 'red', sw: 'red' });
});

test('setting pixels at three zoom levels', () => {
    let pixels = initPixels();
    pixels = setPixel(pixels, 4, 3, 0, 'yellow');
    pixels = setPixel(pixels, 16, 13, 2, 'black');
    pixels = setPixel(pixels, 9, 7, 1, 'red');

    const pixel = getPixel(pixels, 4, 3, 0);

    assert.deepEqual(pixel, { ne: 'yellow', nw: { ne: 'yellow', nw: 'yellow', se: 'yellow', sw: 'black' }, se: 'red', sw: 'yellow' });
});

test('get zoomed in pixel', () => {
    let pixels = initPixels();
    pixels = setPixel(pixels, 4, 3, 0, 'yellow');
    pixels = setPixel(pixels, 16, 13, 2, 'black');
    pixels = setPixel(pixels, 9, 7, 1, 'red');

    let pixel = getPixel(pixels, 9, 7, 1);

    assert.equal(pixel, 'red');

    pixel = getPixel(pixels, 16, 13, 2);

    assert.equal(pixel, 'black');

    pixel = getPixel(pixels, 8, 6, 1);

    assert.deepEqual(pixel, { nw: 'yellow', ne: 'yellow', se: 'yellow', sw: 'black' });
});

run();
