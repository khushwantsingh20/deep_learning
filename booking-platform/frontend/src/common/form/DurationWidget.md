*Default*

```js
initialState = { value: null };
<>
    <DurationWidget value={state.value} onChange={value => setState({ value })} />
    <p><strong>Value:</strong> {state.value}</p>
</>
```

*Set minuteStep*

```js
initialState = { value: null };
<>
    <DurationWidget value={state.value} onChange={value => setState({ value })} minuteStep={5} />
    <p><strong>Value:</strong> {state.value}</p>
</>
```
