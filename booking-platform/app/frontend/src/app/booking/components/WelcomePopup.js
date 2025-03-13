import { Button } from 'antd';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import popupBg from '../../../images/popup-bg.jpg';

import styles from './WelcomePopup.less';

function WelcomePopup({ closeModal }) {
    return (
        <div className={styles.bd}>
            <div className={styles.change}>
                <img src={popupBg} alt="Southern Cross powered by Limomate" />
            </div>
            <div className={styles.ft}>
                <p>
                    <span>Southern Cross is now powered by Limomate</span>
                    Explore our whole NEW online experience
                </p>
                <Button type="primary" onClick={closeModal}>
                    Explore
                </Button>
                <div className={styles.existingClients}>
                    Welcome to our new website. As an existing client you&apos;ll need to
                    <br />
                    <Link to="/request-password-reset/">update your password</Link>
                    &nbsp;before making a booking.
                </div>
            </div>
        </div>
    );
}

export default WelcomePopup;

WelcomePopup.propTypes = {
    closeModal: PropTypes.func.isRequired,
};
