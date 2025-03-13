```js
const options = [
    {
        id: 1,
        label: 'Clear White (UD)',
        colorName: 'clearWhite',
        colorValue: '#fff',
    },
    {
        id: 2,
        label: 'Panthera Metal (P2M)*',
        colorName: 'pantheraMetal',
        colorValue: '#111',
    },
    {
        id: 3,
        label: 'Silky silver (4SS)*',
        colorName: 'silkySilver',
        colorValue: '#9a9ca2',
    },
];
initialState = { selected: null };
<ColorSelector label="Colour Selector" options={options} onChange={value => setState({ selected: value })} value={state.selected} />
```

Non-interactive version. You can pass though a selected key to highlight an option.
```js
const options = [
    {
        id: 1,
        label: 'Clear White (UD)',
        colorName: 'clearWhite',
        colorValue: '#fff',
    },
    {
        id: 2,
        label: 'Panthera Metal (P2M)*',
        colorName: 'pantheraMetal',
        colorValue: '#111',
    },
    {
        id: 3,
        label: 'Silky silver (4SS)*',
        colorName: 'silkySilver',
        colorValue: '#9a9ca2',
    },
];
initialState = { selected: 3 };
<ColorSelector label="Colour Selector" options={options} value={state.selected} isSummary />
```
