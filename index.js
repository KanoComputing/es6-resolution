const path = require('path');
const resolve = require('resolve');

function resolvePath(match, g2, filePath, rootDir) {
    const base = path.dirname(filePath);
    let resolution;
    try {
        resolution = resolve.sync(g2, { basedir: rootDir });
    } catch (e) {
        try {
            resolution = resolve.sync(g2, { basedir: base });
        } catch (e) {
            return match;
        }
    }
    let importeeId = path.relative(base, resolution);
    if (!importeeId.startsWith('.')) {
        importeeId = `./${importeeId}`;
    }
    return importeeId.replace(/\\/g, '/')
}

module.exports = (rootDir, body, mime, filePath, urlPath, onModule = () => {}) => {
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
    if (normalizedPath.indexOf('page/page.js') !== -1) {
        return body.replace('}(this,', '}(window,');
    }
    if (normalizedPath.indexOf('md5.js') !== -1) {
        return body.replace('})(this)', '})(window)');
    }
    if (normalizedPath.indexOf('twemoji-min/2/twemoji.min.js') !== -1) {
        return body.replace('var twemoji=function()', 'window.twemoji=function()');
    }
    if (normalizedPath.indexOf('tone/build/Tone.js') !== -1) {
        return body.replace('}(this, function(){', '}(window, function(){');
    }
    if (normalizedPath.indexOf('tfjs/dist/tf.js') !== -1) {
        return body.replace('}(this, (function (exports) {', '}(window, (function (exports) {');
    }
    if (!body) {
        return body;
    }
    body = body.replace(/(import|export) (.+ from )?'(.+)'/g, (match, g0, g1, g2) => {
        if (g2 && (g2.startsWith('.') || g2.startsWith('/'))) {
            return match;
        }
        const importeeId = resolvePath(match, g2, filePath, rootDir);
        onModule(g2);
        return `${g0} ${g1 || ''}'${importeeId}'`;
    });
    body = body.replace(/(.{1})?import\('(.*?)'\)(\s*)(.{1})/g, (match, g1, g2, g3, g4) => {
        if (g1 === '.' || g4 === '{' || (g2 && (g2.startsWith('.') || g2.startsWith('/')))) {
            return match;
        }
        const importeeId = resolvePath(match, g2, filePath, rootDir);
        return `${g1 || ''}import('${importeeId}')${g3}${g4}`;
    });
    
    return body;
};
