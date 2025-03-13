import PropTypes from 'prop-types';
import React from 'react';
import styles from './Hero.less';

function HeroImage(props) {
    const { image, heading, subHeading } = props;
    return (
        <div className={styles.hero}>
            <div className={styles.slide} style={{ backgroundImage: `url(${image})` }}>
                <div className={styles.heroInner}>
                    <div>
                        <div className={styles.heading}>
                            <span className={styles.mainHead}>{heading}</span>
                            <span className={styles.subHead}>{subHeading}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HeroImage;

HeroImage.propTypes = {
    image: PropTypes.string.isRequired,
    heading: PropTypes.string.isRequired,
    subHeading: PropTypes.string,
};
