import { Button } from 'antd';
import React from 'react';
import PropTypes from 'prop-types';
import ColorBox from './ColorBox';

import styles from './ColorSelector.less';

function ColorSelector({ options, onChange, value, label, isSummary, showClear }) {
    const renderOptions = () => {
        if (isSummary) {
            return options.map(option => (
                <ColorBox
                    wrapperComponent="div"
                    colorValue={option.colorValue}
                    colorName={option.colorName}
                    label={option.label}
                    isSelected={value === option.id}
                    key={`key-${option.colorName}`}
                />
            ));
        }
        return options.map(option => {
            const isSelected = Number(value) === option.id;
            return (
                <ColorBox
                    wrapperComponent="label"
                    colorValue={option.colorValue}
                    colorName={option.colorName}
                    label={option.label}
                    htmlFor={`id-${option.colorName}`}
                    isSelected={isSelected}
                    key={`key-${option.colorName}`}
                >
                    <input
                        onChange={e => onChange(e.currentTarget.value)}
                        onClick={() => {
                            // Toggle off if clicked again
                            if (isSelected) {
                                onChange(null);
                            }
                        }}
                        checked={isSelected}
                        name="colourOptions"
                        value={option.id}
                        type="radio"
                        id={`id-${option.colorName}`}
                    />
                </ColorBox>
            );
        });
    };

    return (
        <div>
            {label && <p>{label}:</p>}
            <div className={showClear ? styles.optionsWrapper : ''}>
                <div className={styles.options}>
                    {renderOptions()}
                    {showClear && (
                        <Button
                            className={styles.clearBtn}
                            onClick={() => onChange(null)}
                            type="link"
                        >
                            Clear Selection
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

ColorSelector.propTypes = {
    options: PropTypes.arrayOf(
        PropTypes.shape({
            colorValue: PropTypes.string,
            colorName: PropTypes.string,
            label: PropTypes.string,
        })
    ),
    /**
     * If true will show a clear link to unset selection
     */
    showClear: PropTypes.bool,
    onChange: PropTypes.func,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    label: PropTypes.string,
    isSummary: PropTypes.bool,
};

export default ColorSelector;
