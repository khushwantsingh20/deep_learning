import React from 'react';
import { Button } from 'antd';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import { deleteModel } from '@alliance-software/djrad/actions';

export default function ClientUnlinkAccount({ link }) {
    const { run, isLoading } = useAsyncRedux(() => deleteModel(link));

    return (
        <Button loading={isLoading} onClick={() => run()} type="danger">
            Remove
        </Button>
    );
}

ClientUnlinkAccount.propTypes = {
    link: modelInstance('scbp_core.accounttoclient').isRequired,
};
