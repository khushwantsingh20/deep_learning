import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router';
import { Link } from 'react-router-dom';
import Row from 'antd/lib/grid/row';
import Col from 'antd/lib/grid/col';

import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import { HolidayModel } from '../models';
import ListView from '../../crud/ListView';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';

const { Item } = ScbpModelFilterForm;

function HolidayFilterForm(props) {
    return (
        <ScbpModelFilterForm model={HolidayModel} layout="horizontal" {...props}>
            <Row>
                <Col span={12}>
                    <Item name="dateFrom" />
                </Col>
                <Col span={12}>
                    <Item name="dateTo" />
                </Col>
            </Row>
        </ScbpModelFilterForm>
    );
}

function HolidayLinkComponent(props) {
    if (props.action === 'copy') {
        const modifiedProps = { ...props };
        modifiedProps.action = 'add';
        return <Link {...modifiedProps} />;
    }
    return <Link {...props} />;
}

HolidayLinkComponent.propTypes = {
    action: PropTypes.string.isRequired,
    record: modelInstance('scbp_core.holiday').isRequired,
};

function RawHolidayListView(props) {
    const columns = [
        'title',
        'date',
        {
            dataIndex: 'actions',
            render(value, record) {
                return (
                    <>
                        <ActionLinkList
                            record={record}
                            actions={['update', 'delete']}
                            linkProps={{ record }}
                        />
                        <ActionLink
                            bypassPermissions
                            action="create"
                            /* model={HolidayModel} */
                            record={record}
                            state={{
                                initialValues: {
                                    title: record.title,
                                    date: record.date
                                        .clone()
                                        .add(1, 'year')
                                        .format('YYYY-MM-DD'),
                                },
                            }}
                            style={{ marginLeft: '20px' }}
                        >
                            Copy
                        </ActionLink>
                    </>
                );
            },
        },
    ];
    const renderFilter = filterProps => <HolidayFilterForm {...filterProps} />;
    return (
        <ListView
            {...props}
            columns={columns}
            renderFilter={renderFilter}
            initialFilterState={{ dateFrom: moment().format('YYYY-MM-DD') }}
        />
    );
}

export const HolidayListView = requirePermissions({ action: 'list', model: HolidayModel })(
    RawHolidayListView
);

export function HolidayDetailView() {
    // Holiday detail view should redirect to the list view - this removes a click from the administration process
    return <Redirect to={HolidayModel.getActionUrl('list')} />;
}

export function HolidayForm(props) {
    return (
        <ScbpModelForm {...props}>
            <ScbpModelForm.Item name="title" />
            <ScbpModelForm.Item name="date" fieldProps={{ allowClear: false }} />
        </ScbpModelForm>
    );
}
