import React from 'react';
import PropTypes from 'prop-types';
import Field from '@alliance-software/djrad/model/fields/Field';
import HtmlWidget from '../components/HtmlWidget';

export function HtmlFormatter(props) {
    const { value, ...remainingProps } = props;
    if (!value) {
        return <div {...remainingProps} />;
    }
    return <div dangerouslySetInnerHTML={{ __html: value }} {...remainingProps} />;
}

HtmlFormatter.propTypes = {
    value: PropTypes.string.isRequired,
};

export default class HtmlField extends Field {
    getDefaultWidget(props) {
        return <HtmlWidget {...props} />;
    }

    getDefaultFormatter(props) {
        return <HtmlFormatter {...props} />;
    }
}
