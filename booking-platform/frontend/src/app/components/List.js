import PropTypes from 'prop-types';
import React from 'react';
import styles from './List.less';

function Item({ children, actions }) {
    return (
        <li>
            <div className={styles.name}>{children}</div>
            {actions && <div className={styles.actions}>{actions}</div>}
        </li>
    );
}

Item.propTypes = {
    actions: PropTypes.node,
};

export default function List({ children }) {
    return <ul className={styles.list}>{children}</ul>;
}

List.Item = Item;
