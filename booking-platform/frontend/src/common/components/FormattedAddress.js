import React from 'react';
import PropTypes from 'prop-types';
import { formatAddress } from '../formatters/address';

const FormattedAddress = ({ address }) => {
    if (address.addressLabel) {
        return (
            <div>
                <div>{address.addressLabel}</div>
                {formatAddress(address.formattedAddress)}
            </div>
        );
    }

    return <React.Fragment>{formatAddress(address.formattedAddress)}</React.Fragment>;
};

FormattedAddress.propTypes = {
    address: PropTypes.object.isRequired,
};

export default FormattedAddress;
