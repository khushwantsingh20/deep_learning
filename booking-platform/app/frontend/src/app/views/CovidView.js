import { Col, Row } from 'antd';
import React from 'react';
import { Helmet } from 'react-helmet';
import TestimonialSlider from '../../common/components/TestimonialSlider';
import { useWebp } from '../../common/hooks/useWebp';
import BookCTA from '../../common/ui/BookCTA';
import CallToActionDownload from '../../common/ui/CallToActionDownload';
import SlideOne from '../../images/banner-passenger-view-city.jpg';
import SlideOneWebp from '../../images/banner-passenger-view-city.webp';
import CovidClean from '../../images/covid-clean.jpg';
import CovidDriver from '../../images/covid-driver.jpg';
import SlideTwo from '../../images/testimonial-slide-lady-in-car.jpg';
import SlideTwoWebp from '../../images/testimonial-slide-lady-in-car.webp';
import SlideThree from '../../images/testimonial-slide.jpg';
import SlideThreeWebp from '../../images/testimonial-slide.webp';
import CovidSticker from '../../images/vaccine-sticker.png';
import styles from './PublicPanelLayout.less';

function CovidView() {
    const supportsWebp = useWebp();

    return (
        <>
            <Helmet>
                <title>COVID 19 Updates | Chauffeur and Car hire Melbourne</title>
            </Helmet>
            <div className={styles.body}>
                <section className={styles.panelTransparent}>
                    <div className={styles.panelBd}>
                        <Row type="flex">
                            <Col xs={{ span: 24 }}>
                                <div className={styles.panelCopy}>
                                    <h1>COVID 19 Updates</h1>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </section>

                <section className={styles.panelTransparent}>
                    <div className={styles.panelBd}>
                        <Row type="flex">
                            <Col xs={{ span: 24 }}>
                                <div className="embed-container">
                                    <iframe
                                        title="Covid safe at Limomate"
                                        width="560"
                                        height="315"
                                        src="https://www.youtube.com/embed/leE0e2hL79c"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
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
                                    <h2>Cleanliness is next to godliness</h2>
                                    <p>
                                        A spotlessly clean car is our undertaking to you. This
                                        includes the car being disinfected and sanitised before each
                                        trip.
                                    </p>

                                    <p>
                                        We have always maintained high standards of cleanliness and
                                        presentation.
                                    </p>

                                    <p>
                                        You can be assured that your vehicle has been cleaned and
                                        prepared to the highest standard by your driver.
                                    </p>
                                </div>
                            </Col>
                            <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                <img src={CovidClean} alt="Covid cleaning" />
                            </Col>
                        </Row>
                    </div>
                </section>
                <section className={styles.panel}>
                    <div className={styles.panelBd}>
                        <Row type="flex">
                            <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                <img src={CovidDriver} alt="Chauffeur wearing face mask" />
                            </Col>
                            <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                <div className={styles.panelCopy}>
                                    <img
                                        src={CovidSticker}
                                        width={60}
                                        alt="I've got my COVID-19 Vaccine."
                                        className={styles.aspectImg}
                                        style={{
                                            float: 'right',
                                            position: 'relative',
                                            right: 0,
                                            top: '-30px',
                                        }}
                                    />
                                    <h2>Our drivers are:</h2>
                                    <ul className={styles.tickList}>
                                        <li>100% Vaccinated</li>
                                        <li>Accredited for COVID-19 Hygiene</li>
                                        <li>Wearing face masks</li>
                                        <li>
                                            Disinfecting all the interior of their vehicle before
                                            every shift.
                                        </li>
                                        <li>Sanitising interior surfaces before every booking.</li>
                                        <li>
                                            Refraining from making direct contact with clients,
                                            wherever possible.
                                        </li>
                                        <li>
                                            Wiping down bags and luggage before placing in boot of
                                            vehicle.
                                        </li>
                                        <li>
                                            The interior of vehicle is completely free of any loose
                                            items. Should you like a general brochure, business card
                                            or bottle of water please ask your driver.
                                        </li>
                                        <li>
                                            Hand sanitiser, tissues and wipes are available in all
                                            vehicles.
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
    );
}

export default CovidView;
