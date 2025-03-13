import React from 'react';

const Lists = () => (
    <React.Fragment>
        <ul>
            <li>An unordered list</li>
            <li>
                <a href="#">With an anchor</a>
            </li>
            <li>
                <p>With a paragraph</p>
            </li>
            <li>
                A list &hellip;
                <ul>
                    <li>with a nested list</li>
                    <li>hello mum.</li>
                </ul>
            </li>
        </ul>

        <ol>
            <li>An ordered list</li>
            <li>
                <a href="#">With an anchor</a>
            </li>
            <li>
                <p>With a paragraph</p>
            </li>
            <li>
                A list &hellip;
                <ol>
                    <li>with a nested list</li>
                    <li>hello mum.</li>
                </ol>
            </li>
        </ol>

        <dl>
            <dt>A definition list term</dt>
            <dd>A definition list description</dd>

            <dt>A definition list term</dt>
            <dd>A definition list description</dd>
        </dl>
    </React.Fragment>
);

export default Lists;
