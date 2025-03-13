import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { ReactComponent as TickIcon } from '../../images/icon-tick.svg';

import styles from './IconButton.less';

function IconButton({
    label,
    text,
    icon,
    size = 'normal',
    selected,
    square,
    onSelect,
    disabled,
    isInactive,
    title = label || text,
    ...props
}) {
    return (
        <div
            className={cx(
                styles.iconButton,
                { [styles.miniIcon]: icon && size === 'small' },
                { [styles.hasIcon]: icon && size !== 'small' },
                { [styles.isSquare]: square },
                { [styles.isSelected]: selected },
                { [styles.isDisabled]: disabled },
                { [styles.isInactive]: isInactive }
            )}
            {...props}
        >
            <button
                type="button"
                className={styles.btn}
                onClick={e => onSelect(e)}
                title={title}
                disabled={disabled}
            >
                {selected && (
                    <span aria-hidden="true" className={styles.selectedIcon}>
                        <TickIcon />
                    </span>
                )}
                {icon ? (
                    <span className={styles.icon} aria-hidden="true">
                        {icon}
                    </span>
                ) : (
                    <span className={styles.text}>{text}</span>
                )}
            </button>
            {label && <span className={styles.label}>{label}</span>}
        </div>
    );
}

IconButton.propTypes = {
    /** Either icon or text */
    icon: PropTypes.node,
    text: PropTypes.string,
    label: PropTypes.string,
    title: PropTypes.string,
    size: PropTypes.string,
    selected: PropTypes.bool,
    square: PropTypes.bool,
    onSelect: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    isInactive: PropTypes.bool,
};

export default IconButton;
