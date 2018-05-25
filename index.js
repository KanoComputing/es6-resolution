const path = require('path');
const resolve = require('resolve');

module.exports = (body, mime, filePath) => {
    if (mime !== 'text/html' && mime !== 'application/javascript') {
        return body;
    }
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (normalizedPath.indexOf('blockly_compressed.js') !== -1) {
        return body.replace('goog.global=this', 'goog.global=window');
    }
    if (normalizedPath.indexOf('cross-storage/dist/client.min.js') !== -1) {
        return body.replace('}(this);', '}(window);');
    }
    if (normalizedPath.indexOf('page.js') !== -1) {
        return body.replace('}(this,', '}(window,');
    }
    if (normalizedPath.indexOf('md5.js') !== -1) {
        return body.replace('})(this)', '})(window)');
    }
    if (normalizedPath.indexOf('twemoji-min/2/twemoji.min.js') !== -1) {
        return body.replace('var twemoji=function()', 'window.twemoji=function()');
    }
    if (!body) {
        return body;
    }
    body = body.replace(/import (.+ from )?'(.+)'/g, (match, g1, g2) => {
        if (g2 && (g2.startsWith('.') || g2.startsWith('/'))) {
            return match;
        }
        const base = path.dirname(filePath);
        const resolution = resolve.sync(g2, { basedir: base });
        const importeeId = path.relative(base, resolution);
        return `import ${g1 || ''}'${importeeId.replace(/\\/g, '/')}'`;
    });
    return body;
};
