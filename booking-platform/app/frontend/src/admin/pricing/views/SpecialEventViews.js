import React from 'react';
import Col from 'antd/lib/grid/col';
import Row from 'antd/lib/grid/row';
import moment from 'moment';

import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import { SpecialEvent } from '../models';
import ListView from '../../crud/ListView';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';
import ScbpModelForm from '../../../common/data/ScbpModelForm';

const { Item } = ScbpModelFilterForm;

function SpecialEventFilterForm(props) {
    return (
        <ScbpModelFilterForm model={SpecialEvent} layout="horizontal" {...props}>
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

function RawSpecialEventListView(props) {
    const columns = [
        'title',
        'date',
        'startTime',
        'endTime',
        'pickupPostcode',
        'dropoffPostcode',
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
                    </>
                );
            },
        },
    ];
    const renderFilter = filterProps => <SpecialEventFilterForm {...filterProps} />;
    return (
        <ListView
            {...props}
            columns={columns}
            renderFilter={renderFilter}
            initialFilterState={{ dateFrom: moment().format('YYYY-MM-DD') }}
        />
    );
}

export const SpecialEventListView = requirePermissions({ action: 'list', model: SpecialEvent })(
    RawSpecialEventListView
);

export function SpecialEventForm(props) {
    return (
        <ScbpModelForm {...props}>
            <ScbpModelForm.Item name="title" />
            <ScbpModelForm.Item name="date" fieldProps={{ allowClear: false }} />
            <ScbpModelForm.Item name="startTime" />
            <ScbpModelForm.Item name="endTime" />
            <ScbpModelForm.Item name="pickupPostcode" />
            <ScbpModelForm.Item name="dropoffPostcode" />
            <ScbpModelForm.Item name="eventSurcharge" />
            <ScbpModelForm.Item name="eventMinimumHours" />
            <ScbpModelForm.Item name="eventMinimumCharge" />
        </ScbpModelForm>
    );
}
