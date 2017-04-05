const AsyncKit = require('./AsyncKit');

module.exports = (creators = {}) => {
    return new AsyncKit(creators);
};