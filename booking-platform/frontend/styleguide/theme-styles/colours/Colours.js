import React from 'react';

import styles from './Colours.less';

const Colours = () => (
    <React.Fragment>
        <h2>Primary colours</h2>
        <ul className={`${styles.colorBlock} ${styles.primaryColours}`}>
            <li>
                <span>Primary 1</span>
            </li>
            <li>
                <span>Primary 2</span>
            </li>
            <li>
                <span>Primary 3</span>
            </li>
            <li>
                <span>Primary 4</span>
            </li>
            <li>
                <span>Primary 5</span>
            </li>
            <li>
                <span>Primary 6</span>
            </li>
            <li>
                <span>Primary 7</span>
            </li>
            <li>
                <span>Primary 8</span>
            </li>
            <li>
                <span>Primary 9</span>
            </li>
            <li>
                <span>Primary 10</span>
            </li>
        </ul>

        <h2>Main colours</h2>
        <ul className={`${styles.colorBlock} ${styles.mainColours}`}>
            <li>
                <span>Primary colour</span>
            </li>
            <li>
                <span>Secondary colour</span>
            </li>
            <li>
                <span>Info colour</span>
            </li>
            <li>
                <span>Success colour</span>
            </li>
            <li>
                <span>Processing colour</span>
            </li>
            <li>
                <span>Error colour</span>
            </li>
            <li>
                <span>Highlight colour</span>
            </li>
            <li>
                <span>Warning colour</span>
            </li>
            <li>
                <span>Normal colour</span>
            </li>
        </ul>

        <h2>Body and Type colours</h2>
        <ul className={`${styles.colorBlock} ${styles.textColours}`}>
            <li>
                <span>Body background colour</span>
            </li>
            <li>
                <span>Text colour</span>
            </li>
            <li>
                <span>Text colour secondary</span>
            </li>
            <li>
                <span>Text colour dark </span>
            </li>
            <li>
                <span>Text colour secondary dark</span>
            </li>
            <li>
                <span>Text colour inverse</span>
            </li>
            <li>
                <span>Text selection colour</span>
            </li>
            <li>
                <span>Link colour</span>
            </li>
            <li>
                <span>Link hover colour</span>
            </li>
            <li>
                <span>Link active colour</span>
            </li>
            <li>
                <span>Heading colour</span>
            </li>
            <li>
                <span>Heading colour dark</span>
            </li>
        </ul>

        <h2>Background and borders</h2>
        <ul className={`${styles.colorBlock} ${styles.backgroundColours}`}>
            <li>
                <span>Background colour base</span>
            </li>
            <li>
                <span>Background colour light</span>
            </li>
            <li>
                <span>Border colour base</span>
            </li>
            <li>
                <span>Border colour split</span>
            </li>
            <li>
                <span>Border colour inverse</span>
            </li>
            <li>
                <span>Outline colour</span>
            </li>
            <li>
                <span>Disabled colour</span>
            </li>
            <li>
                <span>Disabled background</span>
            </li>
            <li>
                <span>Disabled colour dark</span>
            </li>
            <li>
                <span>Shadow colour</span>
            </li>
            <li>
                <span>Shadow colour inverse</span>
            </li>
        </ul>
    </React.Fragment>
);

export default Colours;
