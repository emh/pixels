const tests = [];

export const test = (name, fn) => tests.push({ name, fn });

export const run = () => {
    let failures = 0;

    tests.forEach(({ name, fn }) => {
        try {
            fn();
            console.log(`\x1b[32m✔ ${name}\x1b[0m`);
        } catch (err) {
            failures++;
            console.log(`\x1b[31m✖ ${name}\x1b[0m`);
            console.error(err);
        }
    }); 

    if (failures > 0) {
        process.exit(1);
    } else {
        console.log('All tests passed!');
    }
};
