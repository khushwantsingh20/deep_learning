import React from 'react';

import styles from './Fonts.less';

const Fonts = () => (
    <React.Fragment>
        <ul className={styles.fontVariables}>
            <li>Base Font: </li>
            <li>Code Font: </li>
            <li>Font size base: </li>
            <li>Font size lg: </li>
            <li>Font size sm: </li>
            <li>Heading 1 size: </li>
            <li>Heading 2 size: </li>
            <li>Heading 3 size: </li>
            <li>Heading 4 size: </li>
            <li>Base line height: </li>
        </ul>
    </React.Fragment>
);

export default Fonts;
