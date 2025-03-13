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
import SlideThree from '../../../images/testimonial-slide.jpg';
import SlideThreeWebp from '../../../images/testimonial-slide.webp';
import ChauffeurService from '../../../images/chauffeur-service.jpg';
import AffordableChauffeur from '../../../images/affordable-chauffeurs.jpg';
import ReliableChauffeur from '../../../images/reliable-chauffeur.jpg';

import styles from '../PublicPanelLayout.less';
import BookDriverButton from '../../components/BookDriverButton';

function PrivateChauffeurView() {
    const supportsWebp = useWebp();
    return (
        <BodyStyle className="servicesTemplate">
            <>
                <div className={styles.body}>
                    <Helmet>
                        <title>
                            Chauffeur Cars Melbourne – Private Chauffeur Melbourne | Limomate
                            Melbourne
                        </title>
                        <meta
                            name="description"
                            content="If you need a highly professional chauffeur driven car in Melbourne, look no further. Book your chauffeur service with Limomate today!"
                        />
                        <meta
                            name="keywords"
                            content="chauffeur, chauffeur car, chauffeur cars Melbourne, chauffeur driven cars Melbourne, chauffeur Melbourne, chauffeur service Melbourne, luxury chauffeur Melbourne, limomate chauffeured cars Melbourne, private chauffeur Melbourne, limomate, limomate app, Southern cross, southern cross vha, vha, vha chauffeured cars Melbourne"
                        />
                    </Helmet>
                    <section className={styles.panelTransparent}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }}>
                                    <div className={styles.panelCopy}>
                                        <h1>Private Chauffeur</h1>
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
                                        <h2>Professional Chauffeur Service</h2>
                                        <p>
                                            At Southern Cross, we understand the fundamental
                                            importance of being on time, every time. Our
                                            professional drivers deliver a service that is
                                            accountable and managed to the highest level of
                                            responsibility and performance. Licensed and fully
                                            insured, Southern Cross vehicles are:
                                        </p>
                                        <ul>
                                            <li>Driven by Government accredited drivers</li>
                                            <li>Carry $5 million Public Liability Insurance</li>
                                        </ul>
                                        <p>
                                            <BookDriverButton label="Book now" />
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img
                                        src={ChauffeurService}
                                        alt="Chauffeur driving through Melbourne"
                                    />
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img
                                        src={AffordableChauffeur}
                                        alt="Woman and Man looking at the man's phone in the back seat of luxury car"
                                    />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Affordable Private Chauffeurs</h2>
                                        <p>
                                            Whether you book your chauffeur for a day trip or
                                            multiple appointments at a time, day time fares start
                                            from just $36 - inclusive of tolls and GST.
                                        </p>
                                        <p>
                                            In addition to a discounted hourly rate for bookings in
                                            excess of 3 hours, we offer discounted rates during
                                            weekday work hours and fixed rates on weekends and late
                                            at night.
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
                                        <h2>Reliable Private Chauffeur Cars</h2>
                                        <p>
                                            Fastidiously maintained for your pleasure and comfort,
                                            our luxury VHA chauffeured cars are all current model
                                            vehicles in perfect mechanical condition. Southern Cross
                                            drivers are career professionals, with the respect,
                                            integrity and pride appropriate for private chauffeur
                                            driving in Melbourne.
                                        </p>

                                        <p>
                                            <BookDriverButton label="Book now" />
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img
                                        src={ReliableChauffeur}
                                        alt="Client on their phone in the back seat of a luxury car while the chauffeur is driving"
                                    />
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
                        quote="The Best. Have used them for years, professionally and privately. They have been reliable and punctual every time and very responsive when we’ve needed a last minute requirement."
                        cite="- Jürgen W. Schneider"
                    />
                    <TestimonialSlider.Slide
                        image={supportsWebp ? SlideThreeWebp : SlideThree}
                        quote="Never ever been late, cars have always been top class. Drivers are always friendly and professional. Would never use taxi's again."
                        cite="- Christina Laria"
                    />
                </TestimonialSlider>
                <BookCTA />
            </>
        </BodyStyle>
    );
}

export default PrivateChauffeurView;
