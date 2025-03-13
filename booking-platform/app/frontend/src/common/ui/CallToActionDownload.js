import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import CtaImage from '../../images/cta-phones.png';
import CtaImageWebp from '../../images/cta-phones.webp';
import { ReactComponent as AppleAppStore } from '../../images/download-app-store.svg';
import { ReactComponent as PlayAppStore } from '../../images/download-app-store-play.svg';

import styles from './CallToActionDownload.less';

function CallToActionDownload(props) {
    const { bottomAnchored } = props;

    return (
        <section className={cx(styles.section, { [styles.sectionBa]: bottomAnchored })}>
            <div className={styles.container}>
                <div className={styles.sectionContent}>
                    <h2>Download the Limomate app</h2>
                    <p>
                        For those on the go, the Limomate app, is just another way for you to book
                        your Southern Cross driver service.
                    </p>

                    <p>Download the app now and book from anywhere, anytime.</p>
                    <p className={styles.appLinks}>
                        <a href="https://apps.apple.com/au/app/limomate/id1439311586">
                            <AppleAppStore />
                        </a>
                        <a href="https://play.google.com/store/apps/details?id=com.southerncross.limomate">
                            <PlayAppStore />
                        </a>
                    </p>
                </div>
                <div className={styles.sectionImage}>
                    <picture>
                        <source type="image/webp" srcSet={CtaImageWebp} />
                        <source type="image/png" srcSet={CtaImage} />
                        <img src={CtaImage} alt="" />
                    </picture>
                </div>
            </div>
        </section>
    );
}

export default CallToActionDownload;

CallToActionDownload.propTypes = {
    bottomAnchored: PropTypes.bool,
};
