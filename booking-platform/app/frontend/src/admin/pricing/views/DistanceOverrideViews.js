import { modelListRoute } from '@alliance-software/djrad/actions';
import ButtonLink from '@alliance-software/djrad/components/ButtonLink';
import { handleErrorResponse } from '@alliance-software/djrad/components/form';
import Form, { SubmissionErrors } from '@alliance-software/djrad/components/form/Form';
import CheckboxWidget from '@alliance-software/djrad/components/form/widgets/CheckboxWidget';
import FileUploadWidget from '@alliance-software/djrad/components/form/widgets/FileUploadWidget';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import { Button, Modal } from 'antd';
import React, { useState } from 'react';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import ListView from '../../crud/ListView';
import { DistanceOverride } from '../models';

export function DistanceOverrideRenderForm(formProps) {
    return (
        <ScbpModelForm {...formProps}>
            <ScbpModelForm.Item name="fromPostcode" />
            <ScbpModelForm.Item name="fromSuburb" />
            <ScbpModelForm.Item name="toPostcode" />
            <ScbpModelForm.Item name="toSuburb" />
            <ScbpModelForm.Item name="fixedDistance" label="Distance" help="Distance in KM" />
            <ScbpModelForm.Item
                name="bidirectionalUpdate"
                help="If checked then the reverse of the above will be created as well"
            />
        </ScbpModelForm>
    );
}

function DistanceOverrideUploader() {
    const [isShowingModal, showModal] = useState(false);
    const formName = 'uploadDistanceOverrides';
    const formActions = useFormActions(formName);
    const { run, isLoading } = useAsyncRedux(data =>
        modelListRoute('post', DistanceOverride, 'upload-csv', data)
    );
    return (
        <>
            <Modal
                visible={isShowingModal}
                title="Upload CSV"
                onCancel={() => showModal(false)}
                onOk={formActions.submit}
                okText="Upload"
                okButtonProps={{ loading: isLoading }}
                cancelButtonProps={{ disabled: isLoading }}
            >
                <p>
                    File should have the following headers:
                    <pre>{`
from suburb
from postcode
to suburb
to postcode
distance`}</pre>
                    Optionally can include a <code>default</code> which will flag an entry to be
                    imported again without suburb details (ie. it&apos;ts the default for the
                    postcode in the absence of any suburb match). Any additional headers will be
                    ignored.
                </p>
                <Form
                    renderErrors={errors =>
                        errors && (
                            <Form.Item fullWidth>
                                <SubmissionErrors errors={errors} />
                            </Form.Item>
                        )
                    }
                    validate={data => ({
                        file: !data.file && 'File is required',
                    })}
                    layout="horizontal"
                    name="uploadDistanceOverrides"
                    onSubmit={async data => {
                        try {
                            await run(data);
                            showModal(false);
                        } catch (err) {
                            handleErrorResponse(err);
                        }
                    }}
                    initialValues={{ bidirectional: true }}
                >
                    <Form.Item label="File">
                        <Form.Field name="file" widget={FileUploadWidget} />
                    </Form.Item>
                    <Form.Item
                        label="Bi-directional?"
                        help="If checked will create a record for each direction with the same distance"
                    >
                        <Form.Field name="bidirectional" widget={CheckboxWidget} />
                    </Form.Item>
                </Form>
            </Modal>
            <Button onClick={() => showModal(true)}>Upload CSV</Button>
        </>
    );
}

function RawDistanceOverrideListView(props) {
    const columns = [
        'fromSuburb',
        'fromPostcode',
        'toSuburb',
        'toPostcode',
        'fixedDistance',

        {
            dataIndex: 'actions',
            render(value, record) {
                return <ActionLinkList record={record} actions={['update', 'delete']} />;
            },
        },
    ];

    const headerButtons = (
        <>
            <DistanceOverrideUploader />
            <ActionLink action="create" model={DistanceOverride} linkComponent={ButtonLink}>
                {`Create new ${DistanceOverride._meta.label}`}
            </ActionLink>
        </>
    );
    return (
        <ListView
            {...props}
            columns={columns}
            headerButtons={headerButtons}
            sortableFields={['fromSuburb']}
        />
    );
}

export const DistanceOverrideListView = requirePermissions({
    action: 'list',
    model: DistanceOverride,
})(RawDistanceOverrideListView);
