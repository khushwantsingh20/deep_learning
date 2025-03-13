import { BodyStyle } from 'alliance-react';
import { Col, Row } from 'antd';
import React from 'react';
import { Helmet } from 'react-helmet';
import TestimonialSlider from '../../../common/components/TestimonialSlider';
import { useWebp } from '../../../common/hooks/useWebp';
import BookCTA from '../../../common/ui/BookCTA';
import CallToActionDownload from '../../../common/ui/CallToActionDownload';
import SlideOne from '../../../images/banner-passenger-view-city.jpg';
import SlideOneWebp from '../../../images/banner-passenger-view-city.webp';
import SlideTwo from '../../../images/testimonial-slide-lady-in-car.jpg';
import SlideTwoWebp from '../../../images/testimonial-slide-lady-in-car.webp';
import SlideThree from '../../../images/testimonial-banner-three.jpg';
import SlideThreeWebp from '../../../images/testimonial-banner-three.webp';
import CorporateCabs from '../../../images/corporate-cabs.jpg';
import CorporateFunctions from '../../../images/corporate-functions.jpg';
import CorporateInvoicing from '../../../images/corporate-invoicing.jpg';

import styles from '../PublicPanelLayout.less';
import BookDriverButton from '../../components/BookDriverButton';

function CorporateCarHireView() {
    const supportsWebp = useWebp();
    return (
        <BodyStyle className="servicesTemplate">
            <>
                <Helmet>
                    <title>Corporate Chauffeur &amp; Car Hire Melbourne - Limomate</title>
                    <meta
                        name="description"
                        content="For safe and reliable corporate car hire in Melbourne, look no further than Limomate. From a corporate chauffeur for business trips, to corporate cabs for Melbourne airport transfers."
                    />
                    <meta
                        name="keywords"
                        content="corporate cabs, corporate cars Melbourne, corporate chauffeur Melbourne, limomate, limomate app, business car hire Melbourne, Corporate limousine Melbourne, Corporate taxi, Southern cross, southern cross vha, chauffeur, chauffeur car, chauffeur cars Melbourne, chauffeur driven cars Melbourne"
                    />
                </Helmet>
                <div className={styles.body}>
                    <section className={styles.panelTransparent}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }}>
                                    <div className={styles.panelCopy}>
                                        <h1>Corporate Chauffeur Driven Car Hire Melbourne</h1>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={CorporateCabs} alt="" />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Private Corporate Travel</h2>
                                        <p>
                                            Tired of regular cabs and not up for the Ride Share
                                            roulette? Our service is available during the day – even
                                            at short notice. Fares start from $38.10 (including
                                            GST). At night, at 60 minutes notice is preferred
                                        </p>

                                        <p>
                                            Once you book, you can set and forget – we’re friendly
                                            and convenient.
                                        </p>
                                        <p>
                                            We offer a luxury corporate car chauffeur service at
                                            affordable prices and take pride in our ability to get
                                            you to and from your accommodation or corporate
                                            function.
                                        </p>
                                        <p>
                                            <BookDriverButton label="Book now" />
                                        </p>
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
                                        <h2>Melbourne Corporate Transfers</h2>
                                        <p>
                                            Attending a corporate function? Book a Southern Cross
                                            car in Melbourne and you will arrive relaxed and on
                                            time! Enjoy your time at the function knowing your
                                            driver will provide you with a safe trip home.
                                            Regardless of the finish time - your driver will be
                                            there when you’re ready.
                                        </p>
                                        <p>
                                            <BookDriverButton label="Book now" />
                                        </p>
                                    </div>
                                </Col>

                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={CorporateFunctions} alt="" />
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={CorporateInvoicing} alt="" />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Invoicing - Cabcredit</h2>
                                        <p>
                                            Once you have travelled, Southern Cross will account to
                                            you, personally or to your Corporation, Division or Cost
                                            Centre to make life easy. Trips are itemised on a
                                            monthly invoice, or can be charged to an individual
                                            credit card and can be billed on a monthly or per-trip
                                            basis.
                                        </p>
                                        <p>
                                            Southern Cross does not charge you for the service until
                                            you have travelled and are completely satisfied with the
                                            service. You will receive an email tax invoice, after
                                            you have travelled.
                                        </p>
                                        <p>
                                            Charges are billed to you via Southern Cross Cabredit
                                            Pty Ltd.
                                        </p>
                                        <p>
                                            Alternatively, pay your driver directly by cash,
                                            Cabcharge or credit card.
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
                        image={supportsWebp ? SlideOneWebp : SlideOne}
                        quote="Never ever been late, cars have always been top class. Drivers are always friendly and professional. Would never use taxi's again."
                        cite="- Christina Laria"
                    />
                    <TestimonialSlider.Slide
                        image={supportsWebp ? SlideThreeWebp : SlideThree}
                        quote="The Best. Have used them for years, professionally and privately. They have been reliable and punctual every time and very responsive when we’ve needed a last minute requirement."
                        cite="- Jürgen W. Schneider"
                    />
                    <TestimonialSlider.Slide
                        image={supportsWebp ? SlideTwoWebp : SlideTwo}
                        quote="Fantastic service. On time, polite, professional, very easy to deal with and great communication."
                        cite="- Suzanne McPhee"
                    />
                </TestimonialSlider>
                <BookCTA />
            </>
        </BodyStyle>
    );
}

export default CorporateCarHireView;
