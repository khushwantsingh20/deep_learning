# Styleguidist

To start the styleguide run `yarn styleguide` and open [http://localhost:6060/](http://localhost:6060/)

See [styleguidist docs](https://react-styleguidist.js.org/docs/documenting.html) for documentation about how to document components.

## Warnings about un-exported components

For components that are wrapped in a HOC (eg. `requirePermissions`) styleguidist will
complain but still find the component. To supress the warning you can also exprort the
original un-wrapped component, eg.

```js
// Named export on un-wrapped component
export class CoreProductListView() {
    ...
}

// Default export as normal
export default requirePermissions(CoreProductListView, { action: 'list', model: CoreProduct });
```

## Fake Browser

If your components needs to manage routes and you want to see that in the component examples add a comment in the first line of the example with the text 'fakeBrowser' like so:

```js
// fakeBrowser
<ComponentThatHasRoutesOrLinks />
```