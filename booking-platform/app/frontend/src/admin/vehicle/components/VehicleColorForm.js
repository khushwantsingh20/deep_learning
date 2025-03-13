import PropTypes from 'prop-types';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import React from 'react';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import ColorBox from '../../../common/ui/ColorBox';

export default function VehicleColorForm(props) {
    const { title, colorCode } = useFormValues(props.formName, ['colorCode', 'title']);
    return (
        <ScbpModelForm {...props}>
            <ScbpModelForm.Item name="title" />
            <ScbpModelForm.Item name="colorCode" />
            <ScbpModelForm.Item name="colorAbbreviation" />
            <ScbpModelForm.Item label="Colour">
                <ColorBox label={title} colorValue={colorCode} />
            </ScbpModelForm.Item>
        </ScbpModelForm>
    );
}

VehicleColorForm.propTypes = {
    formName: PropTypes.string.isRequired,
};
