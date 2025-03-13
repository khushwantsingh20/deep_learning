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
import SlideTwo from '../../../images/testimonial-banner-three.jpg';
import SlideTwoWebp from '../../../images/testimonial-banner-three.webp';
import SlideThree from '../../../images/testimonial-banner-one.jpg';
import SlideThreeWebp from '../../../images/testimonial-banner-one.webp';
import CarInterior from '../../../images/car-interior.jpg';
import WomanOnPhone from '../../../images/woman-on-phone.jpg';
import FamilyTravel from '../../../images/family-travel.jpg';
import Minor from '../../../images/minor.jpg';

import styles from '../PublicPanelLayout.less';
import BookDriverButton from '../../components/BookDriverButton';

function SouthernCrossAssistView() {
    const supportsWebp = useWebp();
    return (
        <BodyStyle className="servicesTemplate">
            <>
                <Helmet>
                    <title>Limomate Assist | Car hire to Make Life Easier | Limomate</title>
                    <meta
                        name="description"
                        content="We strive to make your life easier. Whether you're looking for a car for family travel, picking up kids, assisting seniors - limomate has you covered. Check out our options now."
                    />
                    <meta
                        name="keywords"
                        content="luxury chauffeur Melbourne, Family moving, senior taxi service, child taxi service, luxury cars, people mover Melbourne, luxury people mover, senior cab service, chauffeur, Southern cross, southern cross vha, vha"
                    />
                </Helmet>
                <div className={styles.body}>
                    <section className={styles.panelTransparent}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }}>
                                    <div className={styles.panelCopy}>
                                        <h1>Southern Cross Assist</h1>
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
                                        src={FamilyTravel}
                                        alt="Boot of car open, filled with lots of colourful suitcases"
                                    />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Family Travel</h2>
                                        <p>
                                            If you’re travelling to the airport with kids and
                                            luggage in tow or need to travel with an oversized item
                                            like a pet, bike or need a number of baby seats, rest
                                            assured that’s all in a day’s work for the team at
                                            Southern Cross! With a fleet of people movers to choose
                                            from and complementary use of baby seats, booster seats
                                            and rear facing capsules, Southern Cross make family
                                            travel as relaxing as your destination.
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
                                        <h2>Luxury People Movers</h2>
                                        <p>
                                            Out for a group lunch in Melbourne or a special event in
                                            regional Victoria and require your own driver? For times
                                            when a maxi cab or stretch limousine won’t do, the
                                            Southern Cross fleet includes ten people movers that can
                                            accommodate up to seven passengers each. Book your own
                                            driver and enjoy a comfortable trip in a modern, luxury,
                                            chauffeur driven people mover.
                                        </p>
                                        <p>
                                            <BookDriverButton label="Book now" />
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={CarInterior} alt="" />
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img
                                        src={Minor}
                                        alt="Child wearing headphones, happy, looking out rear car window"
                                    />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Children and Minors</h2>
                                        <p>
                                            If you’re unable to drive your primary school aged child
                                            to after school activities, or need your teenager
                                            accompanied to their party or flight check-in, no
                                            problem.
                                        </p>

                                        <p>
                                            From ballet, swimming and piano lessons through to the
                                            graduation ball, clients have relied on Southern Cross
                                            for the safe transport of their children for many years.
                                        </p>

                                        <p>
                                            All drivers are vetted and trained to guarantee your
                                            child’s safety. Working with Children checks are
                                            mandatory for all our drivers and a zero blood-alcohol
                                            policy applies whenever our drivers are on duty.
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
                                        <h2>Seniors - driving Ms Daisy</h2>
                                        <p>
                                            If you, or a loved one, need a little assistance with
                                            everyday transportation, no trip is too short for our
                                            dependable drivers. From medical appointments and
                                            luncheons in town to trips to the hairdresser, the
                                            chemist or the bank, Southern Cross drivers provide a
                                            safe and superior service for elderly clientele. If you
                                            want the peace of mind of an obliging driver and a
                                            punctual service and wish to maintain a level
                                            independence, Southern Cross can be relied upon -
                                            absolutely.
                                        </p>
                                        <p>
                                            <BookDriverButton label="Book now" />
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={WomanOnPhone} alt="" />
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

export default SouthernCrossAssistView;
