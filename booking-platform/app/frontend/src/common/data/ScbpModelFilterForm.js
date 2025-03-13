import React from 'react';
import ModelFilterForm from '@alliance-software/djrad/components/filter/ModelFilterForm'; // eslint-disable-line

export default function ScbpModelFilterForm(props) {
    return <ModelFilterForm layout="horizontal" {...props} />;
}

ScbpModelFilterForm.Item = ModelFilterForm.Item;
ScbpModelFilterForm.Field = ModelFilterForm.Field;
ScbpModelFilterForm.Widget = ModelFilterForm.Widget;
ScbpModelFilterForm.Button = ModelFilterForm.Button;
