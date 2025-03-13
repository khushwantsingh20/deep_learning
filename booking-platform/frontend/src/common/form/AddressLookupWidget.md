```js
initialState = { address: null };
<>
  <AddressLookupWidget value={state.address} onChange={address => setState({ address })}/>
  <hr />
  <p>Value:</p>
  <pre>
    {JSON.stringify(state.address, null, 2)}
  </pre>
</>
```
