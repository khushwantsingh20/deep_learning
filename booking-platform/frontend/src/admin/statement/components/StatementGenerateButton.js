import { Button } from 'antd';
import React, { useState } from 'react';

import ReckonDownloadModal from './ReckonDownloadModal';
import StatementGenerateModal from './StatementGenerateModal';

export default function StatementGenerateButton() {
    const [newStatementVisible, setNewStatementVisible] = useState(false);
    const [statementExportVisible, setStatementExportVisible] = useState(false);
    const show = setter => () => setter(true);
    const hide = setter => () => setter(false);

    return (
        <>
            <Button onClick={show(setStatementExportVisible)} style={{ marginRight: '20px' }}>
                Download Data for Reckon
            </Button>
            <Button onClick={show(setNewStatementVisible)}>Generate New Statements</Button>
            <ReckonDownloadModal
                visible={statementExportVisible}
                closeModal={hide(setStatementExportVisible)}
            />
            <StatementGenerateModal
                visible={newStatementVisible}
                closeModal={hide(setNewStatementVisible)}
            />
        </>
    );
}
