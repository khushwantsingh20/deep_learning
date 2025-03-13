import React from 'react';
import { Row, Col, Icon } from 'antd';
import { Link } from 'react-router-dom';
import { ReactComponent as Logo } from '../../images/limomate-logo-mono.svg';

function GlobalFooter() {
    const year = new Date().getFullYear();
    return (
        <footer className="footer">
            <div className="content-info">
                <Row>
                    <Col xs={{ span: 16, offset: 4 }} md={{ span: 7, offset: 2 }}>
                        <Logo className="footer-logo" />
                    </Col>
                    <Col xs={{ span: 18, offset: 3 }} md={{ span: 13, offset: 0 }}>
                        <nav className="footer-nav">
                            <ul>
                                <li>
                                    <Link to="/melbourne-airport-transfers/">
                                        Airport Transfers
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/chauffeur-services/">Chauffeur Services</Link>
                                </li>
                                <li>
                                    <Link to="/chauffeur-services/private-chauffeur/">
                                        Private Car Services
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/chauffeur-services/weddings-events/">
                                        Wedding Cars
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/driving-with-southern-cross/">
                                        Driving with Southern Cross
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/our-story/">Our Story</Link>
                                </li>
                                <li>
                                    <Link to="/terms-conditions/">Terms &amp; Conditions</Link>
                                </li>
                                <li>
                                    <Link to="/privacy/">Privacy Policy</Link>
                                </li>
                                <li>
                                    <Link to="/faq/">FAQ</Link>
                                </li>
                                <li>
                                    <Link to="/contact/">Contact Us</Link>
                                </li>
                            </ul>
                        </nav>
                        <div>
                            <p>Southern Cross &copy; {year}</p>
                            <ul className="social">
                                <li>
                                    <a href="https://www.linkedin.com/company/southern-cross-chauffeur-drive">
                                        <Icon type="linkedin" />
                                        <span className="sr-only">LinkedIn</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="https://www.instagram.com/southern_cross_chauffeur_drive/">
                                        <Icon type="instagram" />
                                        <span className="sr-only">Instagram</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="https://www.facebook.com/Southern-Cross-Chauffeur-Drive-325608554208812/">
                                        <Icon type="facebook" />
                                        <span className="sr-only">Facebook</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </Col>
                </Row>
            </div>
        </footer>
    );
}

export default GlobalFooter;
