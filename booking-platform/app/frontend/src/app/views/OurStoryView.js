import ButtonLink from '@alliance-software/djrad/components/ButtonLink';
import { Col, Row } from 'antd';
import React from 'react';
import cx from 'classnames';
import { Helmet } from 'react-helmet';
import TestimonialSlider from '../../common/components/TestimonialSlider';
import { useWebp } from '../../common/hooks/useWebp';
import BookCTA from '../../common/ui/BookCTA';
import CallToActionDownload from '../../common/ui/CallToActionDownload';
import SlideOne from '../../images/banner-passenger-view-city.jpg';
import SlideOneWebp from '../../images/banner-passenger-view-city.webp';
import SlideTwo from '../../images/testimonial-banner-three.jpg';
import SlideTwoWebp from '../../images/testimonial-banner-three.webp';
import SlideThree from '../../images/testimonial-banner-one.jpg';
import SlideThreeWebp from '../../images/testimonial-banner-one.webp';
import AboutLogo from '../../images/limomate-about-logo.jpg';
import ClientLogos from '../../images/client-logos.jpg';
import TeamImgOne from '../../images/team.jpg';
import TeamImgTwo from '../../images/driver-open-car.jpg';

import styles from './PublicPanelLayout.less';

function OurStoryView() {
    const supportsWebp = useWebp();
    return (
        <>
            <Helmet>
                <title>About Limomate by Southern Cross | Chauffeur and Car hire Melbourne</title>
                <meta
                    name="description"
                    content="Learn about our drivers, cars, and why Limomate by Southern Cross is one of Melbourne's most trusted car services."
                />
                <meta
                    name="keywords"
                    content="limomate, limomate app, about drivers, about cars, about us, limousine service Melbourne, Southern cross, southern cross vha, vha, chauffeur driven cars Melbourne, luxury chauffeur Melbourne, private chauffeur Melbourne, chauffeur cars Melbourne airport"
                />
            </Helmet>
            <div className={styles.body}>
                <section className={styles.panelTransparent}>
                    <div className={styles.panelBd}>
                        <Row type="flex">
                            <Col xs={{ span: 24 }}>
                                <div className={styles.panelCopy}>
                                    <h1>About Us</h1>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </section>

                <section className={styles.panel}>
                    <div className={styles.panelBd}>
                        <Row type="flex" justify="center">
                            <Col xs={{ span: 24 }} md={{ span: 16, offset: 4 }}>
                                <img
                                    src={AboutLogo}
                                    alt=""
                                    width="580"
                                    className={styles.aspectImg}
                                />
                            </Col>
                        </Row>
                        <Row type="flex">
                            <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                <div className={cx(styles.panelCopy, styles.panelCopySmall)}>
                                    <p className={styles.lede}>
                                        Our logo says a lot about who we are – We place client
                                        priority at the top of everything we do.
                                    </p>
                                    <p>
                                        Mission Critical. That’s the way we like to think about our
                                        service. When you need to get somewhere, we’ll make it
                                        happen. It’s the Southern Cross way, and it comes with the
                                        territory when you’ve been in the business of driving Since
                                        1961.
                                    </p>

                                    <p>
                                        Getting from A to B should be easy, but missed flights, bad
                                        weather, road works and chaotic traffic can send even the
                                        best laid plans astray. Enter our chauffeur service. Getting
                                        you to where you need to be is in our DNA. Our drivers are
                                        friendly, accommodating and highly experienced in
                                        negotiating Melbourne’s sprawling metropolis – and when they
                                        say they’ll be there, they’ll be there.
                                    </p>

                                    <p>
                                        We understand that your journey starts the moment you step
                                        out the door. That’s why we’re always on time.
                                    </p>
                                </div>
                            </Col>
                            <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                <div className={cx(styles.panelCopy, styles.panelCopySmall)}>
                                    <p>
                                        We’ll greet you with an immaculate car and provide a
                                        comfortable ride all the way to your chosen destination – be
                                        it the airport, office, an important meeting or business
                                        event.
                                    </p>

                                    <p>
                                        Smart and sophisticated, our team of drivers pride
                                        themselves on making your journey seamless from start to
                                        finish, ensuring you can focus on what’s really important –
                                        getting on with your plans.
                                    </p>

                                    <p>
                                        With around 5000 trips per month and over 1.5 million since
                                        we hit the pedal for the first time you can guarantee we
                                        know a thing or fifty about exceptional service. And for us
                                        exceptional means every minor detail, from the range of ways
                                        you can book, to the reliability and trustworthiness of our
                                        team.
                                    </p>

                                    <p>
                                        When you choose Southern Cross you’re not just getting a
                                        transfer – but true service, guaranteed. Every single time.
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
                                <div
                                    className={cx(styles.panelCopyReversed, styles.panelCopySmall)}
                                >
                                    <h2>Our Drivers</h2>
                                    <p>
                                        Southern Cross run a fleet of 30 owner-driven cars in
                                        addition to company operated vehicles. Financially committed
                                        to the business, professional owner drivers form the core of
                                        our driver group.
                                    </p>

                                    <p>
                                        The standards required by the Commonwealth Government and
                                        multinational clients are applied to all bookings, along
                                        with OH&S policies. Our strict screening, testing and
                                        training arrangements ensure that your driver:
                                    </p>

                                    <ul>
                                        <li>
                                            Is accredited to drive a commercial passenger vehicle
                                            (including Police, Working with Children and medical
                                            checks)
                                        </li>
                                        <li>Has excellent knowledge of Melbourne</li>
                                        <li>Has completed defence driver training</li>
                                        <li>Works to a roster in order to manage fatigue</li>
                                        <li>Maintains a phone-free driving policy</li>
                                        <li>Maintains a zero blood-alcohol policy</li>
                                    </ul>

                                    <p>
                                        Our drivers do not organise bookings while driving and
                                        concentrate solely on the road, and customer satisfaction.
                                        In addition, our drivers adhere to a strict set of uniform
                                        requirements that ensures an easily recognisable image. This
                                        is particularly helpful on arrival at Melbourne Airport and
                                        other public meeting points.
                                    </p>
                                </div>
                            </Col>
                            <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                <img src={TeamImgOne} alt="" />
                                <img src={TeamImgTwo} alt="" />
                            </Col>
                        </Row>
                    </div>
                </section>

                <section className={styles.panel}>
                    <div className={styles.panelBd}>
                        <Row type="flex">
                            <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                <div className={styles.panelCopy}>
                                    <img src={ClientLogos} alt="" className={styles.aspectImg} />
                                </div>
                            </Col>
                            <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                <div className={styles.panelCopy}>
                                    <h2>Our Clients</h2>
                                    <p>
                                        Southern Cross services a large number of corporate clients,
                                        covering everything their busy schedule has to offer. Many
                                        of our clients are individuals or business owners looking
                                        for a reliable, personal transport service. We invite you to
                                        contact us to learn more about what we can offer your
                                        company.
                                    </p>
                                    <p>
                                        <ButtonLink type="primary-gradient" to="/contact/">
                                            Contact Us
                                        </ButtonLink>
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

export default OurStoryView;
