import React from 'react';
import PropTypes from 'prop-types';

/**
 * Render full page loading indicator
 */
export default function FullPageLoading({ children = 'Loading...' }) {
    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {children}
        </div>
    );
}

FullPageLoading.propTypes = {
    children: PropTypes.node,
};
