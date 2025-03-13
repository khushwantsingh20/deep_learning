import { BodyStyle } from 'alliance-react';
import React from 'react';
import { Helmet } from 'react-helmet';

function TermsView() {
    return (
        <BodyStyle className="standardTemplate">
            <>
                <Helmet>
                    <title>Terms and Conditions | Limomate</title>
                    <meta
                        name="description"
                        content="Limomate specialises in Chauffeur Cars, Limousines, and Airport Transfers Melbourne wide. Contact us today for further information."
                    />
                    <meta
                        name="keywords"
                        content="limousine melbourne, southern cross vha,  chauffeur cars Melbourne, chauffeur service Melbourne, luxury chauffeur Melbourne, limomate"
                    />
                </Helmet>
                <div className="container">
                    <div className="mainContent">
                        <h1>Terms and Conditions</h1>

                        <h2 className="textUppercase">1. Inclusions</h2>

                        <p>Prices are valid from 1st March 2019</p>

                        <ul>
                            <li>All rates include GST, road tolls &amp; State Government fees.</li>
                            <li>30 minutes grace applies to bookings from Melbourne Airport</li>
                            <li>10 minutes grace applies on all other bookings</li>
                            <li>Parking from Melbourne Airport up to 30 minutes</li>
                        </ul>

                        <h2 className="textUppercase">2. Additional Charges</h2>

                        <p>
                            Parking from Melbourne airport beyond 30 minutes is not included. Other
                            expenses may include street parking in the City or luggage trolleys.
                        </p>

                        <h2 className="textUppercase">3. Surcharges</h2>

                        <p>
                            Surcharges apply to and from Major Events. Please consult Price
                            Calculator on Home Page or call our office for advice.
                        </p>

                        <h2 className="textUppercase">4. Cancellation Policy and Fee</h2>

                        <p>
                            <strong>Bookings from 5.00am to 10.00pm:</strong>
                            <br />
                            More than 45 minutes notice: No charge applies
                            <br />
                            Less than 45 minutes notice: Minimum charge applies
                        </p>
                        <p>
                            <strong>Bookings from 10.00pm to 5.00am:</strong>
                            <br />
                            More than 60 minutes notice: No charge applies
                            <br />
                            Less than 60 minutes notice: Minimum charge applies
                        </p>

                        <h2>5. No Contact</h2>

                        <p>
                            When we provide a car as requested and no contact is made with the
                            passenger, the relevant minimum charge applies.
                        </p>

                        <h2 className="textUppercase">6. Payment Methods</h2>

                        <div className="ant-table">
                            <table>
                                <tbody className="ant-table-tbody">
                                    <tr className="ant-table-row">
                                        <td>Direct to the Driver</td>
                                        <td>
                                            VISA, MasterCard, Amex, Diners, Cabcharge, Motorpass or
                                            Cash.
                                        </td>
                                    </tr>
                                    <tr className="ant-table-row">
                                        <td>Charge to your Credit Card</td>
                                        <td>
                                            After each trip or each Month, with an itemised Invoice
                                        </td>
                                    </tr>
                                    <tr className="ant-table-row">
                                        <td>By EFT on 30 Day Terms</td>
                                        <td>Upon acceptance of your application.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <h2 className="textUppercase">7. Credit Card and Cabcharge Fees</h2>

                        <p>Credit Card payments attract a processing fee (inc GST) as follows:</p>

                        <div className="ant-table">
                            <table>
                                <tbody className="ant-table-tbody">
                                    <tr className="ant-table-row">
                                        <td>Visa or MasterCard</td>
                                        <td>2%</td>
                                    </tr>
                                    <tr className="ant-table-row">
                                        <td>American Express</td>
                                        <td>3%</td>
                                    </tr>
                                    <tr className="ant-table-row">
                                        <td>Diners Card</td>
                                        <td>5%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <p>
                            Southern Cross processes these cards under the Merchant Name &ldquo;
                            Southern Cross Cab Credit&rdquo;. Charges to your card will appear on
                            your Statement as &ldquo;Southern Cross Cab Credit&rdquo;.
                        </p>

                        <p>
                            Payments by Cabcharge card, Carcharge voucher or E-Ticket are processed
                            by Cabcharge and attract a 5% service fee. Motorpass is also processed
                            by Cabcharge and attracts their relevant service fee.
                        </p>

                        <h2 className="textUppercase">8. In car payments</h2>

                        <p>
                            In car payments by credit card (Visa, MasterCard or AMEX) are processed
                            via Paypal and attract a 2% processing fee (inc GST).
                        </p>

                        <h2 className="textUppercase">9. Interstate bookings not in Victoria</h2>

                        <p>
                            Bookings organised Interstate are serviced by our network of affiliates.
                            The charge for the service is passed on at cost plus an $11 booking fee.
                        </p>
                    </div>
                </div>
            </>
        </BodyStyle>
    );
}

export default TermsView;
