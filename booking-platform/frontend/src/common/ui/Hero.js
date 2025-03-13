import React from 'react';
import cx from 'classnames';
import PropTypes from 'prop-types';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';

import styles from './Hero.less';

function Hero({ children, type }) {
    const params = {
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        autoplay: true,
        autoplaySpeed: 5000,
    };

    return (
        <div className={cx(styles.hero, { [styles[`hero${type}`]]: type })}>
            <Slider {...params}>{children}</Slider>
        </div>
    );
}

Hero.propTypes = {
    type: PropTypes.string,
};

export default Hero;

function HeroSlide(props) {
    const { image, heading, subHeading, ...rest } = props;

    return (
        <div {...rest} className={styles.slide} style={{ backgroundImage: `url(${image})` }}>
            <div className={styles.heroInner}>
                <div>
                    <div className={styles.heading}>
                        <span className={styles.mainHead}>{heading}</span>

                        <span className={styles.subHead}>{subHeading}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

HeroSlide.propTypes = {
    image: PropTypes.string.isRequired,
    heading: PropTypes.string.isRequired,
    subHeading: PropTypes.string,
};

Hero.Slide = HeroSlide;
