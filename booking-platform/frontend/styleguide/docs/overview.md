By default this style guide will display a few base components and default theme information. Any changes made to the site theme will be reflected here.

This style guide will be much more useful for developers if you add the site specific components.

See [styleguidist docs](https://react-styleguidist.js.org/docs/documenting.html) for documentation about how to document components.

## Gotchas

### Warnings about un-exported components

For components that are wrapped in a HOC (eg. `requirePermissions`) styleguidist will
complain but still find the component. To supress the warning you can also exprort the
original un-wrapped component, eg.

```js static
// Named export on un-wrapped component
export class CoreProductListView() {
    ...
}

// Default export as normal
export default requirePermissions(CoreProductListView, { action: 'list', model: CoreProduct });
```

### Fake Browser

If your components needs to manage routes and you want to see that in the component examples add a comment in the first line of the example with the text 'fakeBrowser' like so:

```js static
// fakeBrowser
<ComponentThatHasRoutesOrLinks />
```

## Adding site components
You can add your own components to the style guide by first editing the `styleguide.config.js` file located in `frontend/src/styleguide`

In the config file there are sections like:

```js static
sections: [
    {
        name: 'Common',
        components: path.join(__dirname, '../src/common/**/[A-Z]*.js'),
    },
],
```

You can add a new object to the sections array and point the 'components' part to where your components are kept.

By default any components that don't have an associated markdown file will not display.

### Rendering components
In order for your component to render in the style guide, the component will require a markdown file with the same name as the component and, by default, located in the same directory.

For example you might have:

``` static
ProductView.js
ProductView.less
ProductView.md
```
Within the markdown file you can call your component and pass through any props. You can also import other components as required.

```jsx static
import { Button } from 'antd';
const data = [
    { title: 'My Title' },
    { title: 'My Other Title' },
];

<ProductView action={<Button type="primary">My Action</Button>} data={data} />
```

You can change the location of the markdown files by using the `content` option in the section configuration. See https://react-styleguidist.js.org/docs/components.html for configuration options.

### Displaying prop types and descriptions
PropTypes will automatically be added from the propType declarations you have defined in the component.

Extra descriptive information can be added by adding a comment above the prop type. E.g.

```jsx static
static propTypes = {
    /** Title to add to HTML head */
    htmlTitle: PropTypes.string,
    /** Page heading */
    header: PropTypes.node,
    /** Page sub heading */
    subHeader: PropTypes.string,
    /** Array of components to be displayed to the right */
    buttons: PropTypes.node,
};
```
