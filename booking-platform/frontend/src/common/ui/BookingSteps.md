```js
import steps from '../../app/booking/steps';
initialState = { current: steps.first() };

<BookingSteps
    steps={steps}
    accessibleSteps={steps}
    labelPlacement="vertical"
    onChange={index => setState({ current: steps.get(index) })}
    current={state.current}
/>
```
