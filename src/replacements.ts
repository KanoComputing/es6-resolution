export interface IReplacement {
    test : RegExp;
    from : string;
    to : string;
}

export const replacements : IReplacement[] = [{
    test : /blockly_compressed\.js$/,
    from: 'goog.global=this',
    to: 'goog.global=window',
}, {
    test : /cross-storage\/dist\/client\.min\.js$/,
    from: '}(this);',
    to: '}(window);',
}, {
    test : /md5\.js$/,
    from: '})(this)',
    to: '})(window)',
}, {
    test : /twemoji-min\/2\/twemoji\.min\.js$/,
    from: 'var twemoji=function()',
    to: 'window.twemoji=function()',
}, {
    test : /tone\/build\/Tone\.js$/,
    from: '}(this, function(){',
    to: '}(window, function(){',
}, {
    test: /tfjs\/dist\/tf\.js$/,
    from: '}(this, (function (exports) {',
    to: '}(window, (function (exports) {',
}];
