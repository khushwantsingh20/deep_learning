import { BodyStyle } from 'alliance-react';
import { Col, Row } from 'antd';
import React from 'react';
import { Helmet } from 'react-helmet';
import TestimonialSlider from '../../common/components/TestimonialSlider';
import { useWebp } from '../../common/hooks/useWebp';
import BookCTA from '../../common/ui/BookCTA';
import CallToActionDownload from '../../common/ui/CallToActionDownload';
import SlideOne from '../../images/banner-passenger-view-city.jpg';
import SlideOneWebp from '../../images/banner-passenger-view-city.webp';
import SlideTwo from '../../images/testimonial-slide-lady-in-car.jpg';
import SlideTwoWebp from '../../images/testimonial-slide-lady-in-car.webp';
import SlideThree from '../../images/testimonial-slide.jpg';
import SlideThreeWebp from '../../images/testimonial-slide.webp';
import PhoneOperator from '../../images/phone-operator.jpg';

import styles from './PublicPanelLayout.less';

function ContactView() {
    const supportsWebp = useWebp();
    return (
        <BodyStyle>
            <>
                <Helmet>
                    <title>Contact Us | Chauffeur Services | Limomate</title>
                    <meta
                        name="description"
                        content="Can't find an answer in our FAQ. Contact Limomate on 1300 12 54 66 for any other enquiries, and find out what service is best for you."
                    />
                    <meta
                        name="keywords"
                        content="contact us, car service Melbourne, luxury car hire melbourne, limousine hire melbourne, Southern cross, southern cross vha, vha, chauffeur car, chauffeur cars Melbourne, chauffeur driven cars Melbourne, chauffeur Melbourne, chauffeur service Melbourne, luxury chauffeur Melbourne, limomate chauffeured cars Melbourne"
                    />
                </Helmet>
                <div className={styles.body}>
                    <section className={styles.panelTransparent}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }}>
                                    <div className={styles.panelCopy}>
                                        <h1>Contact Us</h1>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img
                                        src={PhoneOperator}
                                        alt="Operator taking a booking on the phone"
                                    />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Southern Cross Office</h2>
                                        <p>
                                            Unit 24,
                                            <br />
                                            58 Mahoneys Road,
                                            <br />
                                            Thomastown, VIC 3074
                                        </p>
                                        <br />
                                        <h3>Contact numbers</h3>
                                        <p>
                                            <strong>Local melbourne:</strong> 9462 8222
                                            <br />
                                            <strong>Toll free:</strong> 1300 12 LIMO(5466)
                                            <br />
                                            <strong>International:</strong> +61 3 9462 8222
                                        </p>

                                        <p>
                                            <small>
                                                Southern Cross HQLC Pty Ltd.
                                                <br />
                                                A.B.N. 24 693 917 564
                                            </small>
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
                                    <div className={styles.panelCopyReversed}>
                                        <h2>Bookings and Sales</h2>
                                        <ul className="noBulletList">
                                            <li>
                                                Bookings and quotes:
                                                <br />
                                                <a href="mailto:bookings@mylimomate.com.au">
                                                    bookings@mylimomate.com.au
                                                </a>
                                            </li>
                                            <li>Bookings by text: 0427018756</li>
                                            <li>
                                                Corporate sales enquiries:
                                                <br />
                                                <a href="mailto:george@mylimomate.com.au">
                                                    george@mylimomate.com.au
                                                </a>
                                            </li>
                                            <li>
                                                Credit card charge payments &amp; queries:
                                                <br />
                                                <a href="mailto:admin@mylimomate.com.au">
                                                    admin@mylimomate.com.au
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Other enquiries</h2>
                                        <ul className="noBulletList">
                                            <li>
                                                Invoice payments &amp; queries:
                                                <br />
                                                <a href="mailto:accounts@mylimomate.com.au">
                                                    accounts@mylimomate.com.au
                                                </a>
                                            </li>
                                            <li>
                                                Franchising &amp; Employment enquiries:
                                                <br />
                                                <a href="mailto:george@mylimomate.com.au">
                                                    george@mylimomate.com.au
                                                </a>
                                            </li>
                                        </ul>
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
                        quote="Fantastic service. On time, polite, professional, very easy to deal with and great communication."
                        cite="- Suzanne McPhee"
                    />
                    <TestimonialSlider.Slide
                        image={supportsWebp ? SlideTwoWebp : SlideTwo}
                        quote="For over 10 years they have met all of my expectations, every time - professional, courteous, punctual. They always maintain clean cars and drivers are happy to help with your luggage to the car."
                        cite="- Silvana Ashford"
                    />
                    <TestimonialSlider.Slide
                        image={supportsWebp ? SlideThreeWebp : SlideThree}
                        quote="The Best. Have used them for years, professionally and privately. They have been reliable and punctual every time and very responsive when we’ve needed a last minute requirement."
                        cite="- Jürgen W. Schneider"
                    />
                </TestimonialSlider>
                <BookCTA />
            </>
        </BodyStyle>
    );
}

export default ContactView;
