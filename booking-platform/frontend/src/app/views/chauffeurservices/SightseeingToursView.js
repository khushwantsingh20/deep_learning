import { BodyStyle } from 'alliance-react';
import { Col, Row } from 'antd';
import React from 'react';
import { Helmet } from 'react-helmet';
import TestimonialSlider from '../../../common/components/TestimonialSlider';
import { useWebp } from '../../../common/hooks/useWebp';
import BookCTA from '../../../common/ui/BookCTA';
import CallToActionDownload from '../../../common/ui/CallToActionDownload';
import SlideThree from '../../../images/testimonial-banner-three.jpg';
import SlideThreeWebp from '../../../images/testimonial-banner-three.webp';
import SlideTwo from '../../../images/testimonial-slide-lady-in-car.jpg';
import SlideTwoWebp from '../../../images/testimonial-slide-lady-in-car.webp';
import SlideOne from '../../../images/testimonial-slide.jpg';
import SlideOneWebp from '../../../images/testimonial-slide.webp';
import MelbCBD from '../../../images/melbourne-cbd.jpg';
import Mornington from '../../../images/mornington-pen.jpg';
import YarraValley from '../../../images/yarra-valley.jpg';
import TwelveApostles from '../../../images/twelve-apostles.jpg';
import LittlePenguins from '../../../images/little-penguins.jpg';
import MtHotham from '../../../images/mt-hotham.jpg';
import styles from '../PublicPanelLayout.less';
import BookDriverButton from '../../components/BookDriverButton';

function SightseeingToursView() {
    const supportsWebp = useWebp();
    return (
        <BodyStyle className="servicesTemplate">
            <>
                <Helmet>
                    <title>Sightseeing Tours Melbourne | Limomate by Southern Cross</title>
                    <meta
                        name="description"
                        content="See beautiful Melbourne and tailor a tour to suit your needs. Experience Melbourne in luxury with Limomate. Don't wait until tomorrow - book now!"
                    />
                    <meta
                        name="keywords"
                        content="Sightseeing tour melbourne, chauffeur driven cars Melbourne, phillip island tour, melbourne tour, mornington peninsula tour, yarra valley tour, snow limo tour, great ocean road tour, luxury tour melbourne, tailored tour Melbourne, limomate, limomate app, southern cross vha, southern cross drivers, Chauffeur tour Melbourne, private car tour melbourne, Southern cross"
                    />
                </Helmet>
                <div className={styles.body}>
                    <section className={styles.panelTransparent}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }}>
                                    <div className={styles.panelCopy}>
                                        <h1>Sightseeing Tours</h1>
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
                                        src={MelbCBD}
                                        alt="Melbourne CBD"
                                        style={{ objectPosition: 'left' }}
                                    />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Melbourne City Sights</h2>
                                        <p>
                                            Welcome to Marvellous Melbourne, the multicultural
                                            capital of Australia. Melbourne is a kaleidoscope of
                                            colour, culture, food and sport with world-class
                                            shopping precincts. Tailor your very own Melbourne City
                                            Sights tour to include stops at:
                                        </p>
                                        <ul>
                                            <li>Federation Square</li>
                                            <li>CBD laneways</li>
                                            <li>Southbank Arts Precinct</li>
                                            <li>The Royal Botanic Gardens</li>
                                            <li>Melbourne Park sports venues</li>
                                            <li>Albert Park Grand Prix track</li>
                                            <li>Antique shops in High Street, Armadale</li>
                                            <li>Brunetti’s in Lygon Street, Carlton</li>
                                        </ul>

                                        <p>Recommended time, 4 – 6 hours.</p>
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
                                        <h2>Mornington Peninsula</h2>
                                        <p>
                                            Just a stone’s throw from Melbourne, enjoy breathtaking
                                            views of Port Phillip Bay and coastal scenery along the
                                            Mornington Peninsula. A thriving hub of wineries and
                                            relaxing waterholes, tailor a Mornington Peninsula tour
                                            to include stops at:
                                        </p>

                                        <ul>
                                            <li>
                                                T&apos; Gallant Wines, Montalto or Port Phillip
                                                Estate
                                            </li>
                                            <li>Lunch at Max’s at Red Hill Estate</li>
                                            <li>enjoy views over the Western Port Bay</li>
                                            <li>
                                                visit Arthur’s Seat or the Peninsula Hot Springs
                                            </li>
                                        </ul>

                                        <p>Recommended time, 6 hours.</p>

                                        <p>
                                            <BookDriverButton label="Book now" />
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img
                                        src={Mornington}
                                        alt=""
                                        style={{ objectPosition: 'right' }}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelBd}>
                            <Row type="flex">
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={YarraValley} alt="Yarra Valley covered in mist" />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>The Yarra Valley</h2>
                                        <p>
                                            Amongst Melbourne’s many marvels, the Yarra Valley
                                            offers wineries equal to the best in the world. Tailor a
                                            Yarra Valley tour to include stops at:
                                        </p>

                                        <ul>
                                            <li>Domain Chandon, Stones, or Yering Station</li>
                                            <li>venture out to De Bortoli Wines</li>
                                            <li>
                                                enjoy lunch at Dame Nellie Melba Estate, Coombes
                                            </li>
                                            <li>visit Healesville Sanctuary</li>
                                            <li>
                                                indulge at the Yarra Valley Dairy or Chocolaterie
                                            </li>
                                        </ul>

                                        <p>Recommended time, 6-8 hours.</p>

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
                                        <h2>Great Ocean Road</h2>
                                        <p>
                                            Built by returned soldiers after WW1, the Great Ocean Rd
                                            is a wonderful road trip. Featuring many lookout points
                                            along the way, including one of Australia’s most visited
                                            tourist attractions – The Twelve Apostles – let Southern
                                            Cross take care of your travels with a choice of stops
                                            along the way including:
                                        </p>

                                        <ul>
                                            <li>
                                                The Great Ocean Rd Chocolaterie and Ice Creamery
                                            </li>
                                            <li>Erskine Falls in Lorne</li>
                                            <li>The Tree Top Walk</li>
                                            <li>The Pole House at Fairhaven</li>
                                            <li>The Great Ocean Road Wildlife Park</li>
                                            <li>
                                                The Twelve Apostles (helicopter rides are available
                                            </li>
                                        </ul>

                                        <p>Recommended time, 12 hours.</p>

                                        <p>
                                            <BookDriverButton label="Book now" />
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img
                                        src={TwelveApostles}
                                        alt="The Twelve Apostles on the Great Ocean Road"
                                        style={{ objectPosition: 'right' }}
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
                                        src={LittlePenguins}
                                        alt="Little penguins of Phillip Island"
                                        style={{ objectPosition: 'center' }}
                                    />
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <div className={styles.panelCopy}>
                                        <h2>Phillip Island</h2>
                                        <p>
                                            One of Victoria’s most prized tourist attractions,
                                            Phillip Island is a fun day trip for all ages with great
                                            food, wine, sporting attractions and animal spotting. A
                                            popular day trip from Melbourne, just off Australia’s
                                            southern coast, tailor your Phillip Island tour to
                                            include stops at:
                                        </p>

                                        <ul>
                                            <li>Phillip Island Winery</li>
                                            <li>The Penguin Parade at Summerland Beach</li>
                                            <li>Seal spotting at Seal Rocks</li>
                                            <li>Koala Conservation Park Wildlife Sanctuary</li>
                                            <li>
                                                Grand prix hot laps at The Phillip Island Circuit!
                                            </li>
                                        </ul>

                                        <p>Recommended time, 10 – 12 hours.</p>

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
                                        <h2>Snow Limo</h2>
                                        <p>
                                            If you wish to visit Victoria’s snowfields – Mt Buller,
                                            Lake Mountain – depart from your hotel at a time of your
                                            choosing in a Southern Cross People Mover or 4WD SUV!
                                            Enjoy a day trip with a tour via The Yarra Valley,
                                            Healesville and The Black Spur, with a designated driver
                                            trained in the mountain conditions who will be assigned
                                            to your booking.
                                        </p>
                                        <p>Recommended time, 12 hours.</p>
                                        <p>
                                            If you are venturing further afield for the night –
                                            Falls Creek, Mt. Hotham - and don’t want to leave your
                                            car exposed on the mountain while you’re there, Southern
                                            Cross will gladly chauffeur you there and have a driver
                                            come back for you at the end of your stay
                                        </p>

                                        <p>
                                            <BookDriverButton label="Book now" />
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }} className={styles.imgCol}>
                                    <img src={MtHotham} alt="Mt. Hotham covered in snow" />
                                </Col>
                            </Row>
                        </div>
                    </section>
                </div>

                <CallToActionDownload bottomAnchored />
                <TestimonialSlider>
                    <TestimonialSlider.Slide
                        image={supportsWebp ? SlideTwoWebp : SlideTwo}
                        quote="Never ever been late, cars have always been top class. Drivers are always friendly and professional. Would never use taxi's again."
                        cite="- Christina Laria"
                    />
                    <TestimonialSlider.Slide
                        image={supportsWebp ? SlideOneWebp : SlideOne}
                        quote="Fantastic service. On time, polite, professional, very easy to deal with and great communication."
                        cite="- Suzanne McPhee"
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

export default SightseeingToursView;
