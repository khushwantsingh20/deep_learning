import ButtonLink from '@alliance-software/djrad/components/ButtonLink';
import PropTypes from 'prop-types';
import React from 'react';

export function scrollToBooking() {
    setTimeout(() => {
        const bookingElement = document.getElementById('booking-form-wrapper');
        if (bookingElement) {
            bookingElement.scrollIntoView({ behavior: 'smooth' });
        }
    }, 50);
}

export default function BookDriverButton({
    type = 'primary-gradient',
    label = 'Book a driver',
    size,
}) {
    return (
        <ButtonLink
            type={type}
            to={{ pathname: '/', state: { showTabs: true } }}
            size={size}
            onClick={scrollToBooking}
        >
            {label}
        </ButtonLink>
    );
}

BookDriverButton.propTypes = {
    type: PropTypes.string,
    label: PropTypes.string,
    size: PropTypes.string,
};
