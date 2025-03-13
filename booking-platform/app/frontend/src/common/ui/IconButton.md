IconButton is rounded by default. Either add an icon or text. Square versions don't have labels.

```js
import {useState} from 'react';
import { Icon } from 'antd';
const [isSelected, setIsSelected] = useState(false);

const toggleSelected = () => {
    setIsSelected(!isSelected);
}

const doNothing = () => {
    console.log('Hi you clicked me');
}

<>
    <IconButton
        label="Default state"
        icon={<Icon type="gitlab" />}
        onSelect={doNothing}
    />
    
    <IconButton
        selected
        label="Selected icon & label"
        icon={<Icon type="gitlab" />}
        onSelect={doNothing}
    />
    
    <IconButton
        text="Last Trip"
        label="16 Closest st. Fitzroy"
        onSelect={doNothing}
    />
    
    <IconButton
        square
        text="Square default"
        onSelect={doNothing}
    />
    
    <IconButton
        square
        selected={isSelected}
        text={isSelected ? 'Selected' : 'Click Me'}
        onSelect={toggleSelected}
    />
</>
```
