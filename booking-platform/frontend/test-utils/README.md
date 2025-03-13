# test-utils

These files are importable in tests without relative prefix:

```js
import { render } from 'test-utils-admin';
import { render } from 'test-utils-app';
```

This is setup in `jest.config.js` under the `moduleDirectories` key.
