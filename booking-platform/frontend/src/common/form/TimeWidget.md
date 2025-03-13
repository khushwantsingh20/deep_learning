*Default*

```js
initialState = { value: null };
<>
    <TimeWidget value={state.value} onChange={value => setState({ value })} />
    <p><strong>Value:</strong> {state.value}</p>
</>
```

*With seconds*

```js
initialState = { value: null };
<>
    <TimeWidget value={state.value} onChange={value => setState({ value })} minuteStep={5} showSeconds />
    <p><strong>Value:</strong> {state.value}</p>
</>
```
