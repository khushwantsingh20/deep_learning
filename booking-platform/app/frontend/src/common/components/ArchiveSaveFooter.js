import useRouter from '@alliance-software/djrad/hooks/useRouter';
import PropTypes from 'prop-types';
import React from 'react';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';

import ModelFormButtonBar from '@alliance-software/djrad/components/model/ModelFormButtonBar';
import { modelDetailRoute } from '@alliance-software/djrad/actions';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';

import ScbpModelForm from '../data/ScbpModelForm';

export default function ArchiveSaveFooter(props) {
    const { history } = useRouter();
    const { run, isLoading } = useAsyncRedux(
        () => modelDetailRoute('post', props.record, 'archive'),
        {
            onSuccess() {
                history.push(props.record.constructor.getActionUrl('list'));
            },
        }
    );

    return (
        <ModelFormButtonBar
            model={props.model}
            record={props.record}
            renderLeft={() =>
                props.record ? (
                    <ScbpModelForm.Button loading={isLoading} type="primary" onClick={run}>
                        Archive
                    </ScbpModelForm.Button>
                ) : (
                    []
                )
            }
        />
    );
}

ArchiveSaveFooter.propTypes = {
    model: PropTypes.func.isRequired,
    record: modelInstance(),
};
