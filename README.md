# ES6 names resolution for servers

Transforms your named ES6 Imports into resolved paths, allowing a browser to fetch the dependencies.

## Usage

```js
const resolve = require('@kano/es6-resolution');

const body = `
import { Utils } from '@acme/my-lib/lib/utils.js';

`;

const upgradedBody = resolve(body, 'application/javascript', __dirname + '/index.js');
```
Will be translated to
```js
import { Utils } from '../../node_modules/@acme/my-lib/lib/utils.js';
```

Browsers will be happy and no code compilation needed
