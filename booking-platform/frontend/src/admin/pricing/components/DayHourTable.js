import range from 'lodash/range';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import { useDispatch } from 'react-redux';

import { updateModel } from '@alliance-software/djrad/actions';
import useListModel from '@alliance-software/djrad/hooks/useListModel';
import { modelClass } from '@alliance-software/djrad/prop-types/model';

import AdminPageHeader from '../../components/AdminPageHeader';
import ScbpModelForm from '../../../common/data/ScbpModelForm';

import styles from './DayHourTable.less';

export default function DayHourTable({ fieldName, model, title, ...fieldOptions }) {
    const dispatch = useDispatch();
    const { records, extraData, isLoading } = useListModel(model, {}, { refetchOn: false });
    if (isLoading) return null;
    const recordTable = {};
    records.toArray().forEach(record => {
        if (!recordTable[record.dayType]) {
            recordTable[record.dayType] = new Array(24);
        }
        recordTable[record.dayType][record.hour] = record;
    });
    const updateRecord = async (dayType, hour, newValue) => {
        const record = recordTable[dayType][hour];
        dispatch(updateModel(record, { [fieldName]: newValue }));
    };

    return (
        <React.Fragment>
            <AdminPageHeader htmlTitle={title} header={title} />
            <table>
                <tbody>
                    <tr>
                        <th />
                        {extraData.dayTypes.map(type => (
                            <th key={'header' + type}>{type[1]}</th>
                        ))}
                    </tr>
                    {range(24).map(hour => (
                        <tr key={hour}>
                            <th className={styles.hourLabel}>{moment({ hour }).format('h A')}</th>
                            {extraData.dayTypes.map(dayType => (
                                <td key={hour + '-' + dayType} className={styles.hourTypeField}>
                                    <ScbpModelForm
                                        record={recordTable[dayType[0]][hour]}
                                        footer={<></>}
                                        name={dayType[0] + '-' + hour}
                                        onSubmit={() => null}
                                    >
                                        <ScbpModelForm.Field
                                            name={fieldName}
                                            allowClear={false}
                                            onChange={newValue => {
                                                updateRecord(dayType[0], hour, newValue);
                                            }}
                                            {...fieldOptions}
                                        />
                                    </ScbpModelForm>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </React.Fragment>
    );
}

DayHourTable.propTypes = {
    fieldName: PropTypes.string.isRequired,
    model: modelClass().isRequired,
    title: PropTypes.string.isRequired,
};
