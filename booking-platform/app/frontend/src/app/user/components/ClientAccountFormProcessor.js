import PropTypes from 'prop-types';
import React from 'react';
import useModelFormProcessor from '@alliance-software/djrad/hooks/useModelFormProcessor';
import { modelClass } from '@alliance-software/djrad/prop-types/model';
import ClientAccountForm from '../components/ClientAccountForm';
import { Account } from '../models';

function ClientAccountFormProcessor({ onSuccess, record }) {
    const { formProps } = useModelFormProcessor({
        model: Account,
        record,
        onSuccess,
    });
    return <ClientAccountForm {...formProps} />;
}
ClientAccountFormProcessor.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    record: modelClass('scbp_core.account'),
};

export default ClientAccountFormProcessor;
