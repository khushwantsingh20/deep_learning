# eWAY Integration

Currently just supports token payments. Using [client side encryption key](https://eway.io/api-v3/#client-side-encryption) to encrypt
credit card number & CCV to avoid requirement on PCI compliance.

## API Keys

See [eway authentication documentation](https://eway.io/api-v3/#authentication) for how to generate API keys

```python
import eway

# To use sandbox set this as well
eway.api_url = 'https://api.sandbox.ewaypayments.com/'
# This assumes you add EWAY_API_KEY and EWAY_API_KEY_PASSWORD to your settings as well
# This integration doesn't read from settings directly as doesn't depend on django
# directly in any way
eway.api_key = settings.EWAY_API_KEY
eway.api_key_password = settings.EWAY_API_KEY_PASSWORD
```

## Python Usage

### Create token

```python
import eway

# cc_number and ccv should be encrypted strings generated on frontend
customer = dict(
    Title="Mr",
    FirstName="John",
    LastName="Smith",
    Country="AU",
    CardDetails={
        "Name": "John Smith",
        "Number": cc_number,
        "ExpiryMonth": "12",
        "ExpiryYear": "22",
        "CVN": ccv,
    },
)
# Returns a TokenPaymentResponse object (see eway.TokenPaymentResponse)
response = eway.TokenPayment.create(customer)
# Save this for charging token later
token_id = response.Customer.TokenCustomerID
```

### Update token

```python
import eway

# cc_number and ccv should be encrypted strings generated on frontend
customer = dict(
    TokenCustomerId=123123123123,
    Title="Mr",
    FirstName="John",
    LastName="Smith",
    Country="AU",
    CardDetails={
        "Name": "John Smith",
        "Number": cc_number,
        "ExpiryMonth": "12",
        "ExpiryYear": "22",
        "CVN": ccv,
    },
)
# Returns a TokenPaymentResponse object (see eway.TokenPaymentResponse)
response = eway.TokenPayment.update(customer)
```

### Charge token

```python
import eway
try:
    # Returns a TokenPaymentResponse object (see eway.TokenPaymentResponse)
    eway.TokenPayment.charge(token_id, amount_in_cents)
except eway.TokenCustomerNotFoundError:
    # Handle specifically token not existing
except eway.EwayApiError:
    # ... all other errors
```


### Retrieve token customer

```python
import eway
try:
    customer = eway.TokenPayment.retrieve(token_id)
except eway.TokenCustomerNotFoundError:
    # Handle specifically token not existing
except eway.EwayApiError:
    # ... all other errors
```

### Refund a transaction

```python
import eway

try:
    transaction = eway.Transaction.refund(transaction_id, amount_in_cents)
except eway.RefundAmountTooHighError:
    # Handle specifically refund amount too high
except eway.EwayApiError:
    # ... all other errors
```

### Retrieve a transaction

```python
import eway

try:
    transaction = eway.Transaction.retrieve(transaction_id)
except eway.RefundAmountTooHighError:
    # Handle specifically refund amount too high
except eway.EwayApiError:
    # ... all other errors
```


## Javascript Usage

### Webpack changes

Update webpack config to add an alias so you can import javascript using '@alliance-software/eway' package:

```js
resolve: {
    alias: {
        '@alliance-software/eway': path.resolve(
            path.dirname(__filename),
            '../django-root/eway/js'
        ),
    },
},
```

### API

To load the eway encryption library and encrypt a value use `useInjectEwayCrypt`. This returns
an object indicating loading and error status of injected script and once resolved the `encryptValue`
function. You can pass the credit card number and CCV to this to encrypt it for sending to backend.

See `EncryptedCreditCardFields` for an example usage of this.

```js
import { useInjectEwayCrypt } from '@alliance-software/eway';

function MyComponent({ saveCreditCard }) {
    const { isLoading, error, encryptValue } = useInjectEwayCrypt(ewayEncryptionKey);
    if (isLoading) {
        return null;
    }
    if (error) {
        return 'There was a problem loading the form, please refresh the page';
    }
    const handleSubmit = data => {
        return saveCreditCard({
            ...data,
            number: encryptValue(data.number),
            ccv: encryptValue(data.ccv),
        }) 
    }; 
    return <CreditCardForm onSubmit={handleSubmit} />;
}
```

### Forms

To make use of the forms you'll need to install

```js
yarn add react-payment-inputs styled-components
```

This is optional.

The `EncryptedCreditCardFields` component renders a form and passes valid details
back in the `onChange` callback. 

Example form using djrad.

```js
import useSettings from '@alliance-software/djrad/hooks/useSettings';
import { EncryptedCreditCardFields } from '@alliance-software/eway';
import { Button } from 'antd';
import React, { useState } from 'react';

import styles from './EwayCreditCardForm.less';

export default function EwayCreditCardForm({ onValidCard }) {
    const { ewayEncryptionKey } = useSettings();
    const [data, setData] = useState({});
    return (
        <form
            onSubmit={e => {
                e.preventDefault();
                e.stopPropagation();
                if (data.isValid) {
                    onValidCard(data);
                }
            }}
        >
            <div className={styles.wrapper}>
                <EncryptedCreditCardFields
                    onChange={setData}
                    ewayEncryptionKey={ewayEncryptionKey}
                />
                <Button
                    htmlType="submit"
                    type="primary"
                    disabled={!data.isValid}
                    className={styles.button}
                >
                    Add Card
                </Button>
            </div>
        </form>
    );
}
```


