import { BodyStyle } from 'alliance-react';
import { Col, Row } from 'antd';
import React from 'react';
import { Helmet } from 'react-helmet';
import TestimonialSlider from '../../../common/components/TestimonialSlider';
import { useWebp } from '../../../common/hooks/useWebp';
import BookCTA from '../../../common/ui/BookCTA';
import CallToActionDownload from '../../../common/ui/CallToActionDownload';
import ConferenceCars from '../../../images/conference-cars.jpg';
import Handshake from '../../../images/handshake.jpg';
import MultilingualDrivers from '../../../images/multilingual-drivers.jpg';
import SlideTwo from '../../../images/banner-passenger-view-city.jpg';
import SlideTwoWebp from '../../../images/banner-passenger-view-city.webp';
import SlideOne from '../../../images/testimonial-slide-lady-in-car.jpg';
import SlideOneWebp from '../../../images/testimonial-slide-lady-in-car.webp';
import SlideThree from '../../../images/testimonial-banner-three.jpg';
import SlideThreeWebp from '../../../images/testimonial-banner-three.webp';

import styles from '../PublicPanelLayout.less';
import BookDriverButton from '../../components/BookDriverButton';

function DelegationsView() {
    const supportsWebp = useWebp();
    return (
        <BodyStyle className="servicesTemplate">
            <>
                <Helmet>
                    <title>Car and Chauffeur hire for Delegations and Delegates | Limomate</title>
                    <meta
                        name="description"
                        content="We provide reliable, comfortable and professional cars perfect for big or small conferences. Treat your delegates with the respect they deserve with limomate. Book today!"
                    />
                    <meta
                        name="keywords"
                        content="private chauffeur Melbourne, delegate car hire Melbourne, delegation car hire Melbourne, conference car hire melbourne, chauffeur driver, multilingual drivers, delegate airport pickup, group car hire, limomate, limomate app, Southern cross, southern cross vha, vha, chauffeur cars Melbourne"
                    />
                </Helmet>

                <div className={styles.body}>
                    <section className={styles.panelTransparent}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }}>
                                    <div className={styles.panelCopy}>
                                        <h1>Delegations</h1>
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
                                        src={ConferenceCars}
                                        alt=""
                                        style={{ objectPosition: 'right' }}
                                    />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Groups / Conferences</h2>
                                        <p>
                                            If you’re hosting a conference – large or small -
                                            entrust Southern Cross drivers to greet your delegates
                                            and transfer them expertly to their hotel. Southern
                                            Cross drivers are experienced in transporting interstate
                                            and overseas guests to conferences every day, greeting
                                            discerning guests and dedicated signboards are
                                            available.
                                        </p>
                                        <p>
                                            Southern Cross is skilled in providing multiple
                                            transfers, to multiple locations and our drivers and
                                            staff are familiar with the vast majority of conference
                                            centres in Melbourne and regional Victoria.
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
                                        <h2>Delegate Airport Transfers</h2>
                                        <p>
                                            If you are pressed for time and can’t meet your
                                            delegate(s) at Melbourne airport, Southern Cross can
                                            greet your guests on your behalf, saving you time and
                                            hassle. If you are hosting multiple delegates that may
                                            be arriving from all over Australia - or from around the
                                            world - Southern Cross can organise your delegates’
                                            Melbourne airport transfers with ease. Customs can be
                                            very time consuming, so Southern Cross employ operations
                                            staff to juggle flight delays and variable traffic.
                                        </p>
                                        <p>
                                            <BookDriverButton label="Book now" />
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={Handshake} alt="" />
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={MultilingualDrivers} alt="" />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Multilingual Drivers</h2>
                                        <p>
                                            Welcome to the ‘United Nations’ of Southern Cross! We
                                            can provide a driver to converse in the following
                                            languages:
                                        </p>

                                        <table>
                                            <tbody>
                                                <tr>
                                                    <td>English</td>
                                                    <td>Spanish</td>
                                                    <td>French</td>
                                                    <td>German</td>
                                                    <td>Greek</td>
                                                </tr>
                                                <tr>
                                                    <td>Turkish</td>
                                                    <td>Lebanese</td>
                                                    <td>Arabic</td>
                                                    <td>Ghanaian</td>
                                                    <td>Eritrean</td>
                                                </tr>
                                                <tr>
                                                    <td>Pakistani</td>
                                                    <td>Afghani</td>
                                                    <td>Indian</td>
                                                    <td>Punjabi</td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <p>
                                            English of course and should you prefer, Cockney –
                                            “where to Guv?”
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
                        image={supportsWebp ? SlideThreeWebp : SlideThree}
                        quote="Never ever been late, cars have always been top class. Drivers are always friendly and professional. Would never use taxi's again."
                        cite="- Christina Laria"
                    />
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
                </TestimonialSlider>
                <BookCTA />
            </>
        </BodyStyle>
    );
}

export default DelegationsView;
