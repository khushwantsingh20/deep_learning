### Accessible Skip links to enable a user to skip nav or to main content

Default State, hidden, focusable by keyboard
```js
const skipLinks = [
    {
        link: '#content',
        text: 'Skip to main content',
    },
    {
        link: '#nav',
        text: 'Skip to main navigation',
    },
];
<SkipLinks links={skipLinks} />
```

Also has a 'visible flag' to show all the time
```js
const skipLinks = [
    {
        link: '#content',
        text: 'Skip to main content',
    },
    {
        link: '#nav',
        text: 'Skip to main navigation',
    },
];
<SkipLinks links={skipLinks} visible />
```
