```js
initialState = { value: null };
<>
    <BookingAddressTypeWidget value={state.value} onChange={value => setState({ value })} />
    <p><strong>Value:</strong> {state.value}</p>
</>
```
