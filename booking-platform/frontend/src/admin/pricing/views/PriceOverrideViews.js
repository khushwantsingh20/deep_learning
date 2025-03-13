import { Spin } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';

import SelectWidget from '@alliance-software/djrad/components/form/widgets/SelectWidget';
import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';
import FieldFormatter from '@alliance-software/djrad/components/model/FieldFormatter';

import { PriceOverride } from '../models';
import ListView from '../../crud/ListView';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import ScbpModelForm from '../../../common/data/ScbpModelForm';

function PriceOverrideSelectWrapper({ fetching, items, clearSearch, ...rest }) {
    return (
        <SelectWidget
            labelInValue
            showSearch
            filterOption={false}
            notFoundContent={fetching ? <Spin size="small" /> : <em>No results found</em>}
            onDropdownVisibleChange={open => !open && clearSearch()}
            placeholder="Any Account"
            {...rest}
        >
            <SelectWidget.Option key={'Any'} title={'Any Account'} value={null}>
                Any Account
            </SelectWidget.Option>
            {items.map(entity => (
                <SelectWidget.Option key={entity.id} value={entity.id}>
                    {entity.label}
                </SelectWidget.Option>
            ))}
        </SelectWidget>
    );
}

PriceOverrideSelectWrapper.propTypes = {
    fetching: PropTypes.bool,
    items: PropTypes.arrayOf(PropTypes.object),
    clearSearch: PropTypes.func,
};

export function PriceOverrideRenderForm(formProps) {
    return (
        <ScbpModelForm {...formProps}>
            <ScbpModelForm.Item name="account">
                <ScbpModelForm.Field name="account" lookupWidget={PriceOverrideSelectWrapper} />
            </ScbpModelForm.Item>
            <ScbpModelForm.Item name="fromPostcode" />
            <ScbpModelForm.Item name="toPostcode" />
            <ScbpModelForm.Item name="startTime" />
            <ScbpModelForm.Item name="endTime" />
            <ScbpModelForm.Item name="fixedCost" />
            <ScbpModelForm.Item name="isAllDay" />
        </ScbpModelForm>
    );
}

function RawPriceOverrideListView(props) {
    const columns = [
        {
            key: 'Account Processed',
            dataIndex: 'account',
            render(value, record) {
                if (value) {
                    const field = PriceOverride._meta.fields.account;
                    return <FieldFormatter record={record} value={value} field={field} />;
                }
                return 'Any Account';
            },
        },
        'fromPostcode',
        'toPostcode',
        {
            dataIndex: 'startTime',
            title: 'Start Time',
            render(value, record) {
                if (value) {
                    const field = PriceOverride._meta.fields.startTime;
                    return <FieldFormatter field={field} record={record} value={value} />;
                }
                return 'All Day';
            },
        },
        'endTime',
        'fixedCost',
        {
            dataIndex: 'actions',
            render(value, record) {
                return (
                    <ActionLinkList
                        record={record}
                        actions={['detail', 'update', 'delete']}
                        linkProps={{ record }}
                    />
                );
            },
        },
    ];
    return <ListView {...props} columns={columns} />;
}

export const PriceOverrideListView = requirePermissions({ action: 'list', model: PriceOverride })(
    RawPriceOverrideListView
);
