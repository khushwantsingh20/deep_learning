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
import TeamImg from '../../images/chauffeur-service.jpg';

import styles from './PublicPanelLayout.less';

function DrivingWithScView() {
    const supportsWebp = useWebp();
    return (
        <BodyStyle>
            <>
                <Helmet>
                    <title>
                        Drive with Limomate | Franchise Opportunities Melbourne | Limomate
                    </title>
                    <meta
                        name="description"
                        content="Make a path of your own with Limomate from Soutjern Cross. Work as a driver, become a franchisee and start earning. Contact us for more information."
                    />
                    <meta
                        name="keywords"
                        content="Franchise, Limomate, Limousine driver, Limo driver Melbourne, Limousine job, driving job, driving job Melbourne, limomate drivers, car driver job melbourne, Southern cross, southern cross vha, vha"
                    />
                </Helmet>
                <div className={styles.body}>
                    <section className={styles.panelTransparent}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }}>
                                    <div className={styles.panelCopy}>
                                        <h1>Driving with Southern Cross</h1>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={TeamImg} alt="" style={{ objectPosition: 'left' }} />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopyReversed}>
                                        <h2>Join the team!</h2>
                                        <p>
                                            Are you a reliable person who thrives on providing great
                                            customer service? Do you take pride in your appearance
                                            and fastidiously care about the presentation of your
                                            car? If you’re always on time and can be trusted with
                                            anyone who travels with you, it’s time for you to join
                                            the Southern Cross team!
                                        </p>
                                        <p>
                                            As a Southern Cross franchise owner, you’ll run simple
                                            one-man business
                                        </p>

                                        <h3>No staff. No stock. No bad debts.</h3>
                                        <p>
                                            You run your own car and look after clients doing what
                                            you love – minus the headaches of small business with
                                            all your chauffeur bookings provided!
                                        </p>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <div className={styles.panelCopyMuted}>
                                        <h2>Chauffeur Driver Benefits</h2>
                                        <p>
                                            Built on long-term relationships with our clients and
                                            franchisees, Southern Cross has a proven business format
                                            that allows for new franchisees to be cash-flow positive
                                            from day one. We have owner-drivers in our fleet who’ve
                                            been with the business in excess of ten years, and the
                                            number of people choosing to travel with Southern Cross
                                            is consistently growing.
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Flexible Working Hours</h2>
                                        <p>
                                            Southern Cross work with you to ensure flexible, ongoing
                                            work. Whether you prefer morning or nights, how much you
                                            work is up to you. You can also hire a driver to keep
                                            your car on the road and your life in balance.
                                        </p>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <div className={styles.panelCopy}>
                                        <h2>Obligation-Free Business Trial</h2>
                                        <p>
                                            We want you to be a success from the moment your car
                                            hits the road. We see no point in you investing your
                                            hard-earned money without knowing this opportunity is
                                            for you. Qualifying applicants have a four-week,
                                            obligation free trial period.
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopyPrimary}>
                                        <h2>Knowledge and Qualifications</h2>
                                        <p>
                                            A good working knowledge of metropolitan Melbourne goes
                                            a long way, however the only formal qualification
                                            required is the Government issued Commercial Passenger
                                            Vehicle Driver Accreditation with metropolitan taxi and
                                            metropolitan hire car endorsement. Visit the Government
                                            Taxi Website for further information.
                                        </p>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <div className={styles.panelCopyReversed}>
                                        <h2>Investment</h2>
                                        <p>
                                            As a franchisee owner-driver you own your car and your
                                            Commercial Passenger Vehicle Licence. Typical set-up
                                            costs can look like this:*
                                        </p>
                                        <h3>Next step?</h3>
                                        <p>
                                            Call our{' '}
                                            <strong>Franchising Director on 03 9462 8222</strong> to
                                            get started!
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <table className={styles.investmentTable}>
                                            <caption>
                                                *Figures exclude GST and are subject to variation
                                            </caption>
                                            <tbody>
                                                <tr>
                                                    <th>Commercial Passenger Vehicle Licence:</th>
                                                    <td>$55</td>
                                                </tr>
                                                <tr>
                                                    <th>Franchise fee:</th>
                                                    <td>$11,000</td>
                                                </tr>
                                                <tr>
                                                    <th>
                                                        Vehicle Rego, Insurance
                                                        <br />
                                                        and first month&apos;s lease:
                                                    </th>
                                                    <td>$3,500</td>
                                                </tr>
                                                <tr>
                                                    <th>Legal, Training &amp; Uniform expenses:</th>
                                                    <td>$3,500</td>
                                                </tr>
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <th>TOTAL:</th>
                                                    <td>$18,055</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                        
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

export default DrivingWithScView;
