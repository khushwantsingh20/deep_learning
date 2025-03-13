```js
function handleSelect() {
    console.log('dummy selected state');
}

<VehicleClassDetails
    title="Business Class"
    description="Mercedes-Benz E-Class, BMW 5 Series, Cadillas XTS or similar"
    maxPassengerCount={3}
    maxLuggageCount={3}
    image="https://www.vha.com.au/Modules/O8.SCCD.BookingWidget/app/assets/images/LuxurySedan.jpg"
    onSelect={() => handleSelect()}
/>;
```

Version for a summary view

```js
<VehicleClassDetails
    title="Business Class"
    description="Mercedes-Benz E-Class, BMW 5 Series, Cadillas XTS or similar"
    maxPassengerCount={3}
    maxLuggageCount={2}
    image="https://www.vha.com.au/Modules/O8.SCCD.BookingWidget/app/assets/images/LuxurySedan.jpg"
    isSummary
/>
```

With price

```js
<VehicleClassDetails
    title="Business Class"
    description="Mercedes-Benz E-Class, BMW 5 Series, Cadillas XTS or similar"
    maxPassengerCount={3}
    maxLuggageCount={2}
    image="https://www.vha.com.au/Modules/O8.SCCD.BookingWidget/app/assets/images/LuxurySedan.jpg"
    price="120"
/>
```
