import useListModel from '@alliance-software/djrad/hooks/useListModel';
import { BodyStyle } from 'alliance-react';
import { Col, Row } from 'antd';
import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import TestimonialSlider from '../../../common/components/TestimonialSlider';
import { useWebp } from '../../../common/hooks/useWebp';
import FullPageLoading from '../../../common/misc/FullPageLoading';
import BookCTA from '../../../common/ui/BookCTA';
import CallToActionDownload from '../../../common/ui/CallToActionDownload';
import LimoRibbons from '../../../images/wedding-couple.jpg';
import SocialShot from '../../../images/sccd-social-shot.jpg';
import SlideOne from '../../../images/testimonial-banner-one.jpg';
import SlideOneWebp from '../../../images/testimonial-banner-one.webp';
import SlideTwo from '../../../images/testimonial-slide-lady-in-car.jpg';
import SlideTwoWebp from '../../../images/testimonial-slide-lady-in-car.webp';
import SlideThree from '../../../images/testimonial-slide.jpg';
import SlideThreeWebp from '../../../images/testimonial-slide.webp';

import styles from '../PublicPanelLayout.less';
import BookDriverButton, { scrollToBooking } from '../../components/BookDriverButton';

export function VehicleList({ records }) {
    const vehicles = records
        .filter(v => v.isInterstate === false && v.maxPassengerCount >= 1 && v.maxBaggageCount >= 1)
        .map(v => {
            const { title, image, description } = v;
            return (
                <li key={v.id}>
                    <img src={image} alt={title} />
                    <Link
                        to={{ pathname: '/', state: { showTabs: true } }}
                        className={styles.vehicleInfo}
                        onClick={scrollToBooking}
                    >
                        <div>
                            <div className={styles.vehicleInfoTitle}>{title}</div>
                            {description}
                        </div>
                        <div className={styles.fauxLink}>Book Now</div>
                    </Link>
                </li>
            );
        });

    return <ul className={styles.vehicleList}>{vehicles}</ul>;
}

VehicleList.propTypes = {
    records: PropTypes.object.isRequired,
};

function WeddingEventsView() {
    const { records, isLoading } = useListModel('scbp_core.vehicleclass');
    const supportsWebp = useWebp();

    if (isLoading) {
        return <FullPageLoading />;
    }

    return (
        <BodyStyle className="servicesTemplate">
            <>
                <Helmet>
                    <title>Wedding Car Hire Melbourne | Wedding Cars | Limomate</title>
                    <meta
                        name="description"
                        content="For stylish, reliable transport on your wedding day, look no further than Limomate. We offer wedding car hire across Melbourne – book today!"
                    />
                    <meta
                        name="keywords"
                        content="wedding limo, wedding limousine, wedding limousine Melbourne, Chauffer wedding limo, luxury limousine Melbourne, limomate, limomate app, wedding car service, wedding car hire Melbourne, just married car, Southern cross, southern cross vha, vha"
                    />
                </Helmet>
                <div className={styles.body}>
                    <section className={styles.panelTransparent}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }}>
                                    <div className={styles.panelCopy}>
                                        <h1>Wedding Car Hire Melbourne</h1>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Chauffeur Driven Wedding Cars</h2>
                                        <p>
                                            If you&apos;re looking for a reliable and stylish
                                            wedding car service in Melbourne (that won&apos;t break
                                            the bank!), you need not look any further than LIMOMATE
                                            Chauffeurs.
                                        </p>

                                        <p>
                                            We offer modern luxury vehicles at affordable prices and
                                            take pride in our ability to offer a highly professional
                                            and unforgettable service for your special day.
                                        </p>

                                        <p>
                                            You may choose to book one or multiple, matching wedding
                                            cars to simply transfer you to your ceremony or stay
                                            with you and your bridal party for the entire day.
                                        </p>

                                        <p>
                                            Your car will be fully detailed prior to your booking.
                                            Our rates include vehicles (in colour of choice),
                                            wedding ribbons (if preferred) and GST.
                                        </p>

                                        <p>
                                            <BookDriverButton label="Book now" />
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={LimoRibbons} alt="" />
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <div className={styles.carOptions}>
                                <h2>Our luxury, modern, chauffeur driven wedding cars include:</h2>
                                <VehicleList records={records} />
                            </div>
                            <div className={styles.carOptionsBookBar}>
                                <BookDriverButton type="primary" label="Book now" />
                            </div>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={SocialShot} alt="" />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Social Event Transfers</h2>
                                        <p>
                                            Why settle for a regular taxi or the ride share roulette
                                            when you can travel in comfort of your very own
                                            chauffeur car? At Southern Cross, we’re dedicated to
                                            providing you with a reliable service at competitive
                                            rates when you’re attending:
                                        </p>
                                        <ul>
                                            <li>Concerts and theatre events</li>
                                            <li>Dinner functions</li>
                                            <li>Private parties</li>
                                            <li>Major Melbourne events</li>
                                        </ul>

                                        <p>
                                            From the Grand Prix or to Spring Racing Carnival race
                                            days, Southern Cross will deliver you and/or your guests
                                            to the most appropriate gate or entrance and designate a
                                            meeting point to collect you from at the end of your
                                            event.
                                        </p>

                                        <p>
                                            <BookDriverButton label="Book now" />
                                        </p>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </section>
                </div>
                <CallToActionDownload bottomAnchored />
                <TestimonialSlider>
                    <TestimonialSlider.Slide
                        image={supportsWebp ? SlideTwoWebp : SlideTwo}
                        quote="The Best. Have used them for years, professionally and privately. They have been reliable and punctual every time and very responsive when we’ve needed a last minute requirement."
                        cite="- Jürgen W. Schneider"
                    />
                    <TestimonialSlider.Slide
                        image={supportsWebp ? SlideThreeWebp : SlideThree}
                        quote="Never ever been late, cars have always been top class. Drivers are always friendly and professional. Would never use taxi's again."
                        cite="- Christina Laria"
                    />
                    <TestimonialSlider.Slide
                        image={supportsWebp ? SlideOneWebp : SlideOne}
                        quote="Fantastic service. On time, polite, professional, very easy to deal with and great communication."
                        cite="- Suzanne McPhee"
                    />
                </TestimonialSlider>
                <BookCTA />
            </>
        </BodyStyle>
    );
}

export default WeddingEventsView;
