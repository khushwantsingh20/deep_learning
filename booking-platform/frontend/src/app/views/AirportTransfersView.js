import useListModel from '@alliance-software/djrad/hooks/useListModel';
import { BodyStyle } from 'alliance-react';
import { Col, Row } from 'antd';
import React from 'react';
import { Helmet } from 'react-helmet';
import TestimonialSlider from '../../common/components/TestimonialSlider';
import { useWebp } from '../../common/hooks/useWebp';
import FullPageLoading from '../../common/misc/FullPageLoading';
import BookCTA from '../../common/ui/BookCTA';
import CallToActionDownload from '../../common/ui/CallToActionDownload';
import HeroImage from '../../common/ui/HeroImage';
import CorporateCabs from '../../images/corporate-cabs.jpg';

import FixedPriceChauffeur from '../../images/reliable-chauffeur.jpg';
import MelAirportTransfer from '../../images/melb-airport-transfer.jpg';
import FamilyAirportTransfers from '../../images/family-airport-transfers.jpg';
import ReliableMelbouneAirportTransfers from '../../images/reliable-melboune-airport-transfers.jpg';
import HeroOne from '../../images/hero-car-door.jpg';
import HeroOneWebp from '../../images/hero-car-door.webp';
import CorporateHire from '../../images/services-corporate-hire.jpg';
import SlideOne from '../../images/testimonial-banner-one.jpg';
import SlideOneWebp from '../../images/testimonial-banner-one.webp';
import SlideTwo from '../../images/testimonial-slide-lady-in-car.jpg';
import SlideTwoWebp from '../../images/testimonial-slide-lady-in-car.webp';
import SlideThree from '../../images/testimonial-slide.jpg';
import SlideThreeWebp from '../../images/testimonial-slide.webp';
import { VehicleList } from './chauffeurservices/WeddingEventsView';
import BookDriverButton from '../components/BookDriverButton';

import styles from './PublicPanelLayout.less';

function AirportTransfersView() {
    const { records, isLoading } = useListModel('scbp_core.vehicleclass');
    const supportsWebp = useWebp();

    if (isLoading) {
        return <FullPageLoading />;
    }

    return (
        <BodyStyle className="servicesTemplate">
            <React.Fragment>
                <Helmet>
                    <title>
                        Airport Transfers Melbourne | City to Airport from $70.50 | Limomate
                    </title>
                    <meta
                        name="description"
                        content="We provide a reliable, comfortable, and punctual Melbourne airport chauffeur and limo transfer. Book your Melbourne airport private transfers with Limomate. Call 1300 12 54 66 now!"
                    />
                    <meta
                        name="keywords"
                        content="chauffeur cars Melbourne airport, chauffeur driven cars Melbourne airport, chauffeur Melbourne airport, chauffeur service Melbourne airport, Melbourne airport chauffeur, airport transfers Melbourne, Melbourne airport limo transfer, Southern cross, southern cross vha, vha, vha chauffeured cars Melbourne, private chauffeur Melbourne"
                    />
                </Helmet>

                <HeroImage
                    image={supportsWebp ? HeroOneWebp : HeroOne}
                    heading="Airport travel made easy."
                    subHeading="On time, every time. Guaranteed."
                />

                <div className={styles.body}>
                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex" align="middle">
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h1 className="textCenter">
                                            Airport Transfer
                                            <br />
                                            Chauffeur Services
                                            <br />
                                            in Melbourne
                                        </h1>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <p>
                                            Book Southern Cross and avoid the vagaries of a regular
                                            cab or rideshare. Southern Cross provides airport
                                            transfers to or from Melbourne Airport at competitive
                                            rates, ensuring safety and providing you with peace of
                                            mind.
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
                                    <img src={CorporateHire} alt="" />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Our Airport Transfer Operating Areas</h2>
                                        <p>
                                            Pre-book your Southern Cross driver from anywhere across
                                            greater Metropolitan Melbourne or Regional Victoria and
                                            we guarantee to be there on time. Southern Cross
                                            services all suburbs. Whether you are travelling to
                                            Melbourne Airport, Essendon Airport, Avalon or even
                                            Moorabbin Airport we guarantee that you will arrive
                                            safely and on time.
                                        </p>
                                        <p>
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
                                        <h2>Fixed Price Chauffeur Cars to Airports in Melbourne</h2>
                                        <p>
                                            When you book a driver to or from Melbourne, Avalon or
                                            Essendon airports, fixed prices apply to all suburbs
                                            across the greater metropolitan area and throughout
                                            Regional Victoria.
                                        </p>
                                        <p>Transfers to Melbourne Airport start from:</p>
                                        <table>
                                            <tr>
                                                <th>Melbourne City</th>
                                                <td>$70.50</td>
                                            </tr>
                                            <tr>
                                                <th>Toorak</th>
                                                <td>$94.40</td>
                                            </tr>
                                            <tr>
                                                <th>Brighton</th>
                                                <td>$101.30</td>
                                            </tr>
                                        </table>
                                        <p>*rates are inclusive of tolls GST and State Govt Fees</p>
                                        <p>
                                            <BookDriverButton />
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={FixedPriceChauffeur} alt="" />
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
                                        <h2>
                                            Your Driver Makes Travelling to the Airport&hellip; Easy
                                        </h2>
                                        <p>
                                            <p>
                                                When you book with Southern Cross you will receive:
                                            </p>
                                            <ol>
                                                <li>
                                                    A detailed email confirmation immediately after
                                                    booking
                                                </li>
                                                <li>A text on approach with your driver details</li>
                                                <li>A modern luxury sedan, SUV or People Mover</li>
                                                <li>
                                                    A spotlessly clean car that has been sanitized
                                                    before your trip
                                                </li>
                                                <li>
                                                    A COVID-19 accredited driver that is a trained
                                                    professional
                                                </li>
                                                <li>
                                                    A fixed upfront price inclusive of all costs
                                                </li>
                                            </ol>
                                        </p>
                                        <p>
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
                                        <h2>Reliable, On-time Melbourne Airport Pick Up</h2>
                                        <p>
                                            Airport transfers are available 7 days, at all hours. We
                                            understand you cannot be late for your flight, so your
                                            Melbourne airport transfer is guaranteed*. Your driver
                                            will always arrive 5-10 minutes early.
                                            <br /> Book a driver to meet your overseas or interstate
                                            guests. Southern Cross will track the flight and meet
                                            your guest inside the terminal.
                                        </p>
                                        <p>
                                            <BookDriverButton />
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={ReliableMelbouneAirportTransfers} alt="" />
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={MelAirportTransfer} alt="" />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Booking a Melbourne Airport Transfer</h2>
                                        <p>
                                            When you book a Melbourne airport transfer with Southern
                                            Cross, our staff will check that you have calculated
                                            your pick-up time correctly. Airport transfers are
                                            allocated in a timely manner to our experienced drivers
                                            through the day, ensuring you’re delivered comfortably,
                                            safely and punctually. Early morning private airport
                                            transfers are allocated to a driver the night before.
                                        </p>
                                        <p>
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
                                        <h2>Flight Monitor Service</h2>
                                        <p>
                                            When you book your chauffeur driven car, we will monitor
                                            your flight arrival time and meet you once your flight
                                            has landed. Your driver will be there at the right time,
                                            day or night, with no waiting charges for domestic
                                            arrivals. For international arrivals, we generally
                                            recommend to have your driver in the terminal as
                                            follows:
                                        </p>
                                        <p>
                                            <BookDriverButton />
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopyReversed}>
                                        <p>
                                            Economy
                                            <br />
                                            45 minutes after actual landing time
                                            <br />
                                            Business Class
                                            <br />
                                            15 minutes after actual landing time
                                            <br />
                                            First Class
                                            <br />
                                            from landing time
                                        </p>
                                        <p>
                                            We understand that changes to flight schedules are not
                                            unusual. Update your flight on the Limomate App, or call
                                            or text from your departing port and we will meet you
                                            from your updated flight.
                                            <br />
                                            If you miss your flight, let us know in order to avoid a
                                            cancellation fee.
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
                                    <img src={FamilyAirportTransfers} alt="" />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>
                                            Airport Travel &ndash; booking process with Limomate
                                        </h2>
                                        <p>When you book via the Limomate app:</p>

                                        <ol>
                                            <li>You can choose your preferred car class</li>
                                            <li>You will receive an all-inclusive price</li>
                                            <li>
                                                Upon booking, you will receive an email confirmation
                                                immediately and a confirmation text when your driver
                                                is on the way
                                            </li>
                                            <li>
                                                Payment is only made after you have travelled and
                                                are completely satisfied with the service
                                            </li>
                                        </ol>

                                        <p>Happy travelling.</p>

                                        <p>
                                            <BookDriverButton />
                                        </p>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <div className={styles.carOptions}>
                                <h2>Our Luxury, Modern, Chauffeur Driven Airport Transfer Fleet</h2>
                                <VehicleList records={records} />
                            </div>
                            <div className={styles.carOptionsBookBar}>
                                <BookDriverButton type="primary" label="Book now" />
                            </div>
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

export default AirportTransfersView;
