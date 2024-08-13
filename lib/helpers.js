Object.prototype.omit = function(...keys) {
    const newObj = { ...this };
    keys.forEach(key => {
        delete newObj[key];
    });
    return newObj;
};