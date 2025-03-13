import React from 'react';

import styles from './BookCTA.less';
import BookDriverButton from '../../app/components/BookDriverButton';

function BookCta() {
    return (
        <section className={styles.section}>
            <div className="container">
                <p>
                    When you&apos;re next travelling, you don&apos;t need the
                    <br />
                    hassle. Book with Southern Cross.
                </p>

                <p>
                    <strong>Reliable &ndash; Comfortable &ndash; On time</strong>
                </p>

                <p>
                    <BookDriverButton type="primary" label="Book Now" size="large" />
                </p>
            </div>
        </section>
    );
}

export default BookCta;
