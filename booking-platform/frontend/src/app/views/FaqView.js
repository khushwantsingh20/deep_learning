import { BodyStyle } from 'alliance-react';
import { Collapse } from 'antd';
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
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

import styles from './FaqView.less';
import BookDriverButton from '../components/BookDriverButton';

const { Panel } = Collapse;

function FaqView() {
    const supportsWebp = useWebp();
    return (
        <BodyStyle className="standardTemplate">
            <React.Fragment>
                <Helmet>
                    <title>
                        Frequently Asked Questions | Chauffeur and Car Hire Services | Limomate
                    </title>
                    <meta
                        name="description"
                        content="Have a question? Check Limomate's frequently asked questions or contact us on 1300 12 54 66."
                    />
                    <meta
                        name="keywords"
                        content="faq, frequently asked questions, limo hire, car hire, limousine Melbourne, Southern cross, southern cross vha, vha, chauffeur driven cars Melbourne, luxury chauffeur Melbourne, private chauffeur Melbourne, chauffeur cars Melbourne airport, airport transfer"
                    />
                </Helmet>
                <div className="container">
                    <div className="mainContent">
                        <h1>Here are some questions about Limomate.</h1>
                        <div className={styles.faqs}>
                            <Collapse bordered={false}>
                                <Panel header="What is the cost of a car?" key="1">
                                    <p>
                                        Your fare depends on your pick-up point, destination, the
                                        number and age of the passengers and the time and day of
                                        travel. Please refer to Price Calculator as a guide.
                                    </p>

                                    <p>
                                        For most trips we can quote a fixed, point-to-point rate.
                                        Sometimes it’s more appropriate to charge on a time basis.
                                        We can quote on almost any trip across Melbourne or Regional
                                        Victoria.
                                    </p>
                                </Panel>
                                <Panel header="Are there any extras to pay?" key="2">
                                    <p>
                                        We try and make our fares simple and transparent. Variations
                                        or extras to a straight point-to-point transfer fare
                                        include: Child Seats, Larger car, Additional pick up points,
                                        Waiting time if applicable and Melbourne Airport parking
                                        fees.
                                    </p>
                                </Panel>
                                <Panel header="How do I book?" key="3">
                                    <p>
                                        To arrange your first booking please contact our office by
                                        phone so we can confirm your details. After that, you are
                                        welcome to use our email Booking Form or by text to
                                        0427018756.
                                    </p>
                                </Panel>
                                <Panel header="How do I pay?" key="4">
                                    <p>
                                        Quote your Credit Card at the time of booking or pay your
                                        driver direct.
                                    </p>
                                </Panel>
                                <Panel header="What kinds of cars are available?" key="5">
                                    <p>
                                        Please refer to Our Fleet section of the booking portal for
                                        a snapshot of our available cars.
                                    </p>
                                </Panel>
                                <Panel header="Do you have stretch limos?" key="6">
                                    <p>Sorry, we don’t offer stretch limousines</p>
                                </Panel>
                                <Panel header="How many passengers?" key="7">
                                    <p>
                                        Our sedans cater for up to four (4) passengers at a time,
                                        the people movers for up to seven (7) passengers. To allow
                                        for luggage, we may recommend an up-size.
                                    </p>
                                </Panel>
                                <Panel header="Do I need to re-confirm?" key="8">
                                    <p>
                                        There is no need to re-confirm but if it helps you get a
                                        better night’s sleep, we’re happy to hear from you.
                                    </p>
                                </Panel>
                                <Panel header="Will the car turn up on time?" key="9">
                                    <p>
                                        Yes. Everything we do serves to achieve this priority. If we
                                        can improve in any way, please be in touch.
                                    </p>
                                </Panel>
                                <Panel header="Will the driver help with luggage?" key="10">
                                    <p>
                                        Your driver will happily assist you with luggage, strapping
                                        kids into their seats, holding an umbrella and anything else
                                        that makes getting to and from easier. .
                                    </p>
                                </Panel>
                                <Panel header="Can you provide baby seats?" key="11">
                                    <p>
                                        Yes we do. Please let us know at the time of booking if you
                                        have children under 8 years of age that are travelling. If
                                        you need your child seats at the other end of your trip, you
                                        are welcome to bring your own.
                                    </p>
                                </Panel>
                                <Panel header="When do I need to book?" key="12">
                                    <p>
                                        Most bookings can be accommodated with 24 hours notice.
                                        Same-day bookings are welcome as we only commit drivers a
                                        few hours ahead.
                                    </p>
                                    <p>
                                        If you’ve booked a flight, it’s wise to book your car. If
                                        you’re planning a conference, have tickets to a Major Event
                                        or need a specific vehicle, please book in advance.
                                    </p>
                                </Panel>
                                <Panel header="What happens if my flight is delayed?" key="13">
                                    <p>
                                        As long as you are on your flight as booked, you can expect
                                        your driver to meet your flight when it lands.
                                    </p>
                                </Panel>
                                <Panel header="What if my flight changes?" key="14">
                                    <p>
                                        If you change flights, let us know from your departing port
                                        and we will allocate a driver accordingly.
                                    </p>
                                </Panel>
                                <Panel
                                    header="Where will I find the driver when I land at Melbourne Airport?"
                                    key="15"
                                >
                                    <p>
                                        Please refer to our{' '}
                                        <Link to="/melbourne-airport-transfers/">
                                            Melbourne Airport Transfers
                                        </Link>{' '}
                                        page for details.
                                    </p>
                                </Panel>
                                <Panel header="What time is the booking office open?" key="16">
                                    <p>
                                        Our Booking Office operates 7-days a week, 6.00am to
                                        11.00pm.
                                    </p>
                                </Panel>
                                <Panel header="Do you do Weddings?" key="17">
                                    <p>
                                        Yes we do. Please refer to our{' '}
                                        <Link to="/chauffeur-services/weddings-events/">
                                            Weddings
                                        </Link>{' '}
                                        page.
                                    </p>
                                </Panel>
                                <Panel header="How do I become a driver?" key="18">
                                    <p>
                                        Please refer to our{' '}
                                        <Link to="/driving-with-southern-cross/">
                                            Driving for Southern Cross
                                        </Link>{' '}
                                        page.
                                    </p>
                                </Panel>
                            </Collapse>
                        </div>

                        <p>
                            <BookDriverButton label="Book a driver now" />
                        </p>
                    </div>
                </div>
                <CallToActionDownload bottomAnchored />
                <TestimonialSlider>
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
                    <TestimonialSlider.Slide
                        image={supportsWebp ? SlideOneWebp : SlideOne}
                        quote="Fantastic service. On time, polite, professional, very easy to deal with and great communication."
                        cite="- Suzanne McPhee"
                    />
                </TestimonialSlider>
                <BookCTA />
            </React.Fragment>
        </BodyStyle>
    );
}

export default FaqView;
