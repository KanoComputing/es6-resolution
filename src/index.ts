import fs from 'fs';
import path from 'path';
import resolve from 'resolve';
import { replacements, IReplacement } from './replacements';

/**
 * Stores the resolved paths
 */
const cache = new Map();

/**
 * Returns a path with separators normalized to forward slashes
 * @param input A path
 */
function normalizePath(input: string) {
    return input.replace(/\\/g, '/');
}

function maybeRealPath(input : string) {
    if (process.env.ES6_RESOLUTION_REALPATH) {
        return fs.realpathSync(input);
    }
    return input;
}

/**
 * Returns a relative path to a module from a named path
 * @param importee Named module path to resolve
 * @param filePath Location on the disk of the importer file
 * @param rootDir Root of the project
 */
function resolvePath(importee : string, filePath : string, rootDir : string) {
    const base = path.dirname(filePath);
    let resolution;
    // If the named module was resolved before, return its path on the disk
    if (cache.has(importee)) {
        resolution = cache.get(importee);
    } else {
        try {
            resolution = resolve.sync(importee, { basedir: rootDir });
        } catch (e) {
            try {
                resolution = resolve.sync(importee, { basedir: base });
            } catch (e) {
                return importee;
            }
        }
        // Save the result
        cache.set(importee, resolution);
    }
    const realPath = maybeRealPath(resolution);
    let importeeId = path.relative(base, realPath);
    if (!importeeId.startsWith('.')) {
        importeeId = `./${importeeId}`;
    }
    const result = normalizePath(importeeId);

    return result;
}

/**
 * Transforms all declarative and dynamic imports of the provided file using named module path into relative module paths
 * @param rootDir Root of the project
 * @param body Contents of the file to transform
 * @param mime Mime type of the file, only js and html files are processed
 * @param filePath Location of the file on the disk
 */
export function resolveNamedPath(rootDir : string, body : string, mime : string, filePath : string) {
    if (mime !== 'text/html' && mime !== 'application/javascript') {
        return body;
    }
    const normalizedPath = normalizePath(filePath);
    if (!body) {
        return body;
    }
    let replacement : IReplacement;
    // Apply the replacements. The first replacement to match will return the new body
    for (let i = 0; i < replacements.length; i += 1) {
        replacement = replacements[i];
        if (replacement.test.test(normalizedPath)) {
            return body.replace(replacement.from, replacement.to);
        }
    }
    // Get the real paths on the disk
    const realFilePath = maybeRealPath(filePath);
    const realRootDir = maybeRealPath(rootDir);
    // Replace declarative imports
    body = body.replace(/((?:import|export)(?:["'\s]*(?:[\w*{}\n\r\t, $]+)from\s*)?\s+["'])(.*(?:[@\w_-]+))(["'\s].*;?)$/gm, (match, start, importee, end) => {
        // Start with . or / means it is not a named import, but a relative or absolute one. Browsers can deal with that
        if (importee && (importee.startsWith('.') || importee.startsWith('/'))) {
            return match;
        }
        // Resolve the path and return the transformed import statement
        const importeeId = resolvePath(importee, realFilePath, realRootDir);
        return `${start}${importeeId}${end}`;
    });
    // Replace dynamic imports
    body = body.replace(/(.{1})?import\('(.*?)'\)(\s*)(.{1})/g, (match, g1, g2, g3, g4) => {
        // Starts with . means it is a method called `import`
        // Followd by { means it is a function declaration
        // Ignore relative or absolute paths
        if (g1 === '.' || g4 === '{' || (g2 && (g2.startsWith('.') || g2.startsWith('/')))) {
            return match;
        }
        // Resolve the path and return the transformed import statement
        const importeeId = resolvePath(g2, realFilePath, realRootDir);
        return `${g1 || ''}import('${importeeId}')${g3}${g4}`;
    });

    return body;
};

export default resolveNamedPath;
