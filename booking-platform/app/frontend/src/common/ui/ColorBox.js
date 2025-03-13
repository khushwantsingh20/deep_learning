import React from 'react';
import cx from 'classnames';
import PropTypes from 'prop-types';

import styles from './ColorSelector.less';

function ColorBox({
    wrapperComponent = 'div',
    colorValue,
    children,
    colorName,
    label,
    isSelected,
    ...rest
}) {
    const WrapperComponent = wrapperComponent;
    return (
        <WrapperComponent
            className={cx(styles.colorBox, { [styles.isSelected]: isSelected })}
            style={{ '--option-bg': colorValue }}
            {...rest}
        >
            {children}
            <span className={styles.colorBoxLabel}>{label}</span>
        </WrapperComponent>
    );
}

ColorBox.propTypes = {
    wrapperComponent: PropTypes.string,
    colorValue: PropTypes.string,
    children: PropTypes.node,
    colorName: PropTypes.string,
    label: PropTypes.string,
    isSelected: PropTypes.bool,
};

export default ColorBox;
