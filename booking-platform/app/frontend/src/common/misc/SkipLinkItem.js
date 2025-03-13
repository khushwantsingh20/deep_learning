import React from 'react';
import PropTypes from 'prop-types';

const SkipLinkItem = ({ link, text, className = '', ...attributes }) => (
    <a className={className} href={link} {...attributes}>
        {text}
    </a>
);

SkipLinkItem.propTypes = {
    link: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    className: PropTypes.string,
};

export default SkipLinkItem;
