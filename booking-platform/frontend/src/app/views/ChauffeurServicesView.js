import ButtonLink from '@alliance-software/djrad/components/ButtonLink';
import { appendToUrl } from '@alliance-software/djrad/util/url';
import { BodyStyle } from 'alliance-react';
import { Col, Row } from 'antd';
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import TestimonialSlider from '../../common/components/TestimonialSlider';
import { useWebp } from '../../common/hooks/useWebp';
import BookCTA from '../../common/ui/BookCTA';
import CallToActionDownload from '../../common/ui/CallToActionDownload';
import HeroImage from '../../common/ui/HeroImage';

import PrivateChauffeur from '../../images/services-private.jpg';
import WeddingsEvents from '../../images/services-weddings-events.jpg';
import CorporateHire from '../../images/services-corporate-hire.jpg';
import Sightseeing from '../../images/services-sightseeing.jpg';
import Delegations from '../../images/services-delegations.jpg';
import SCAssist from '../../images/services-sc-assist.jpg';
import HeroOne from '../../images/passenger-on-ipad.jpg';
import HeroOneWebp from '../../images/passenger-on-ipad.webp';
import SlideOne from '../../images/testimonial-banner-one.jpg';
import SlideOneWebp from '../../images/testimonial-banner-one.webp';
import SlideTwo from '../../images/testimonial-slide-lady-in-car.jpg';
import SlideTwoWebp from '../../images/testimonial-slide-lady-in-car.webp';
import SlideThree from '../../images/testimonial-slide.jpg';
import SlideThreeWebp from '../../images/testimonial-slide.webp';

import styles from './PublicPanelLayout.less';
import BookDriverButton from '../components/BookDriverButton';

function ChauffeurServicesView(props) {
    const supportsWebp = useWebp();
    const urlPrefix = props.match.url;

    return (
        <BodyStyle className="servicesTemplate">
            <React.Fragment>
                <Helmet>
                    <title>Limomate Services | Chauffeurs and Car Hire in Melbourne</title>
                    <meta
                        name="description"
                        content="Limomate specialises in Chauffeur Cars, Limousines, and Airport Transfers Melbourne wide. Contact us today for further information."
                    />
                    <meta
                        name="keywords"
                        content="car service melbourne, limousine hire melbourne, airport limousine melbourne, airport transfer melbourne, chauffer hire melbourne, corporate car, social event hire, limo hire Melbourne, limo service, Southern cross, southern cross vha, vha"
                    />
                </Helmet>

                <HeroImage
                    image={supportsWebp ? HeroOneWebp : HeroOne}
                    heading="You book the car. We do the rest."
                    subHeading="On time, every time. Guaranteed."
                />

                <div className={styles.body}>
                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Our Chauffeur Service</h2>
                                        <p className={styles.lede}>
                                            Do you require a chauffeur, a corporate car, a people
                                            mover for family travel or a driver to collect delegates
                                            for conference? Book Southern Cross and get the
                                            convenience of a taxi in a private, current model
                                            chauffeur driven car.
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <p style={{ marginTop: '54px' }}>
                                            Southern Cross provides a chauffeur car service that is
                                            safe, reliable and affordable, across Melbourne and
                                            Regional Victoria at very competitive rates. Explore our
                                            range of chauffeur services below or get in touch with
                                            our friendly staff to discuss your travel needs{' '}
                                            <Link to="/contact/">here</Link>.
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
                                    <img src={PrivateChauffeur} alt="" />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Private Chauffeur</h2>
                                        <p>
                                            Why settle for a regular taxi or lesser alternative,
                                            when you can ride in the comfort of your very own
                                            private chauffeur car? Southern Cross is dedicated to
                                            providing dependable service in Melbourne and regional
                                            Victoria at a highly competitive rate. Our drivers are
                                            highly experienced and reliable, promising to get you
                                            where you need to be - on time, every time.
                                        </p>
                                        <p>
                                            <ButtonLink
                                                type="primary-gradient"
                                                to={appendToUrl(urlPrefix, 'private-chauffeur')}
                                            >
                                                Learn more
                                            </ButtonLink>
                                            <BookDriverButton />
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
                                        <h2>Weddings &amp; Social Events</h2>
                                        <p>
                                            Arrive in style - and on time – to life’s most special
                                            occasions with Southern Cross chauffeurs. Our
                                            professional, experienced chauffeur drivers make travel
                                            to and from weddings and special events luxurious and
                                            hassle-free. Book in advance or contact our office at
                                            short notice, with our private chauffeur drivers service
                                            all of greater metropolitan Melbourne and regional
                                            Victoria.
                                        </p>
                                        <p>
                                            <ButtonLink
                                                type="primary-gradient"
                                                to={appendToUrl(urlPrefix, 'weddings-events')}
                                            >
                                                Learn more
                                            </ButtonLink>
                                            <BookDriverButton />
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={WeddingsEvents} alt="" />
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={CorporateHire} alt="" />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Corporate Car Hire</h2>
                                        <p>
                                            Need a corporate car in Melbourne? If you’re looking for
                                            a hassle-free solution to simply get you from A to B or
                                            multiple business meetings, look no further.
                                        </p>

                                        <p>
                                            Southern Cross is a comfortable and convenient way for
                                            corporates to travel.
                                        </p>

                                        <p>
                                            Consider Southern Cross as a viable alternative when
                                            getting to business meetings or lunches. Pre-book a
                                            Southern Cross corporate cab and your driver will help
                                            you keep to a tight schedule, without the stress of
                                            driving or parking yourself.
                                        </p>
                                        <p>
                                            <ButtonLink
                                                type="primary-gradient"
                                                to={appendToUrl(urlPrefix, 'corporate-car-hire')}
                                            >
                                                Learn more
                                            </ButtonLink>
                                            <BookDriverButton />
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
                                        <h2>Sightseeing Tours</h2>
                                        <p>
                                            Nobody knows the streets and sights of Melbourne and
                                            regional Victoria like Southern Cross drivers! Enjoy a
                                            Southern Cross tour in the comfort of your own chauffeur
                                            driven car, with itineraries tailored to suit your
                                            interests and the length of your stay. Choose from one
                                            of the following tour locations of feel welcome to
                                            contact our office to discuss your particular
                                            requirements.
                                        </p>
                                        <p>
                                            <ButtonLink
                                                type="primary-gradient"
                                                to={appendToUrl(urlPrefix, 'sightseeing-tours')}
                                            >
                                                Learn more
                                            </ButtonLink>
                                            <BookDriverButton />
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={Sightseeing} alt="" />
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={Delegations} alt="" />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Delegations</h2>
                                        <p>
                                            If you’re hosting a senior delegation that requires the
                                            services of an expert chauffeur, Southern Cross is well
                                            placed to assist with reliable, flexible and no-nonsense
                                            drivers for your delegates that - like all good waiters
                                            – won’t spill a drop!
                                        </p>

                                        <p>
                                            <ButtonLink
                                                type="primary-gradient"
                                                to={appendToUrl(urlPrefix, 'delegations')}
                                            >
                                                Learn more
                                            </ButtonLink>
                                            <BookDriverButton />
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
                                        <h2>Southern Cross Assist</h2>
                                        <p>
                                            Safety Guarantee. Southern Cross drivers provide an
                                            easy, reliable and affordable service for families,
                                            groups, minors and the elderly. Every driver carries a
                                            Police Check and Working with Children Check, our
                                            chauffeurs assist those unable to drive themselves or
                                            those wanting to avoid rigours of city or regional
                                            traffic.
                                        </p>
                                        <p>
                                            <ButtonLink
                                                type="primary-gradient"
                                                to={appendToUrl(urlPrefix, 'southern-cross-assist')}
                                            >
                                                Learn more
                                            </ButtonLink>
                                            <BookDriverButton />
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={SCAssist} alt="" />
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
            </React.Fragment>
        </BodyStyle>
    );
}

export default ChauffeurServicesView;
