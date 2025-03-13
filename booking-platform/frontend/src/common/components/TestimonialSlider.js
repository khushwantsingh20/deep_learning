import React from 'react';
import cx from 'classnames';
import PropTypes from 'prop-types';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';

import styles from './TestimonialSlider.less';

function TestimonialSlider({ children }) {
    const params = {
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        autoplay: true,
        autoplaySpeed: 15000,
    };

    return <Slider {...params}>{children}</Slider>;
}

export default TestimonialSlider;

function TestimonialSliderSlide(props) {
    const { image, quote, cite, ...rest } = props;

    return (
        <div
            {...rest}
            className={cx(styles.slide, 'swiper-slide')}
            style={{ backgroundImage: `url(${image})` }}
        >
            <div className={styles.sliderBody}>
                <div className={styles.sliderContent}>
                    <blockquote className={styles.quote}>
                        <p>{quote}</p>
                        <cite>{cite}</cite>
                    </blockquote>
                </div>
            </div>
        </div>
    );
}

TestimonialSliderSlide.propTypes = {
    image: PropTypes.string.isRequired,
    quote: PropTypes.string.isRequired,
    cite: PropTypes.string.isRequired,
};

TestimonialSlider.Slide = TestimonialSliderSlide;
