import React from 'react';

const Tables = () => (
    <React.Fragment>
        <table>
            <caption>A simple table caption</caption>
            <thead>
                <tr>
                    <th>Heading</th>
                    <th colSpan="2">Heading</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Cell one</td>
                    <td>Cell two</td>
                    <td>Cell three</td>
                </tr>
            </tbody>
        </table>
    </React.Fragment>
);

export default Tables;
