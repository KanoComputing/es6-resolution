const path = require('path');
const resolve = require('resolve');

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
    if (!body) {
        return body;
    }
    body = body.replace(/import (.+ from )?'(.+)'/g, (match, g1, g2) => {
        if (g2 && (g2.startsWith('.') || g2.startsWith('/'))) {
            return match;
        }
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
        onModule(g2);
        return `import ${g1 || ''}'${importeeId.replace(/\\/g, '/')}'`;
    });
    body = body.replace(/(.{1})import\((.+?)\)\s*(.{1})/g, (match, g1, g2, g3) => {
        if (g1 === '.' || g3 === '{') {
            return match;
        }
        const base = path.dirname(filePath);
        const fileRoot = path.normalize(filePath);
        const pathRoot = path.normalize(urlPath);
        const root = fileRoot.replace(pathRoot, '');
        const rel = path.relative(root, base);
        let normalizedRel = rel.replace(/\\/g, '/');
        if (!normalizedRel.startsWith('/')) {
            normalizedRel = `/${normalizedRel}`;
        }
        if (normalizedRel === '/') {
            normalizedRel = '';
        }

        const importeeId = `'${normalizedRel}/' + ${g2}`;

        const func = `${g1 || ''}new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.type = 'module';
                script.src = ${importeeId};
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            })${g3 || ''}`;
        
        return func;
    });
    
    return body;
};
