import useElementFocus from '@alliance-software/djrad/hooks/useElementFocus';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import { Row, Col, Modal, notification, Alert } from 'antd';
import pick from 'lodash/pick';
import { appendToUrl } from '@alliance-software/djrad/util/url';
import PropTypes from 'prop-types';
import React, { useCallback, useReducer } from 'react';
import { Link } from 'react-router-dom';
import { Redirect } from 'react-router';
import { useSelector } from 'react-redux';
import Helmet from 'react-helmet';
import { useWebp } from '../../../common/hooks/useWebp';
import api from '../../../common/api';
import TestimonialSlider from '../../../common/components/TestimonialSlider';
import useBreakpoint from '../../../common/hooks/useBreakpoint';
import BookingSteps from '../../../common/ui/BookingSteps';
import CallToActionDownload from '../../../common/ui/CallToActionDownload';
import Hero from '../../../common/ui/Hero';
import HeroOne from '../../../images/hero-inside-car.jpg';
import HeroOneWebp from '../../../images/hero-inside-car.webp';
import HeroTwo from '../../../images/banner-melbourne-central-business-district.jpg';
import HeroTwoWebp from '../../../images/banner-melbourne-central-business-district.webp';
import HeroThree from '../../../images/banner-crown-event.jpg';
import HeroThreeWebp from '../../../images/banner-crown-event.webp';
import HeroFour from '../../../images/banner-passenger-view-city.jpg';
import HeroFourWebp from '../../../images/banner-passenger-view-city.webp';
import FixedPriceChauffeur from '../../../images/reliable-chauffeur.jpg';
import CorporateHire from '../../../images/services-corporate-hire.jpg';
import PrivateChauffeur from '../../../images/services-private.jpg';
import SCAssist from '../../../images/services-sc-assist.jpg';
import Sightseeing from '../../../images/services-sightseeing.jpg';
import WeddingsEvents from '../../../images/services-weddings-events.jpg';
import SlideTwo from '../../../images/testimonial-slide-lady-in-car.jpg';
import SlideTwoWebp from '../../../images/testimonial-slide-lady-in-car.webp';
import SlideOne from '../../../images/testimonial-slide.jpg';
import SlideOneWebp from '../../../images/testimonial-slide.webp';
import SlideThree from '../../../images/testimonial-banner-three.jpg';
import SlideThreeWebp from '../../../images/testimonial-banner-three.webp';
import ClientAccountFormProcessor from '../../user/components/ClientAccountFormProcessor';
import LoginRegister from '../../user/components/LoginRegister';
import { useActiveAccount } from '../../user/hooks';
import useCreateUpdateBookingNavigation from '../hooks/useCreateUpdateBookingNavigation';
import useCreateUpdateBookingController from '../hooks/useCreateUpdateBookingController';
import useCreateBookingState from '../hooks/useCreateBookingState';
import { WriteOnlyBooking } from '../models';
import steps, { BookingStep } from '../steps';
import CreateBookingButtonBar from './CreateBookingButtonBar';
import { User } from '../../user/models';
import { ReactComponent as IconTick } from '../../../images/icon-outline-circle-tick.svg';
import { ReactComponent as IconPillow } from '../../../images/icon-outline-pillow.svg';
import { ReactComponent as IconOnTime } from '../../../images/icon-outline-on-time.svg';
import { ReactComponent as IconCleanliness } from '../../../images/icon-cleanliness.svg';

import styles from './CreateBookingController.less';

/**
 * For the specified step return that initial values required for that step from
 * the current booking state or default values if not set.
 */
function getFormInitialValues(step, bookingContext, currentUser) {
    const { data: bookingState, defaultVehicleClass } = bookingContext;
    const data = pick(bookingState, step.dataKeys.toArray());
    for (const entry of step.defaultValues.entrySeq()) {
        const [key, value] = entry;
        if (data[key] === undefined) {
            data[key] = value;
        }
    }
    if (step.dataKeys.includes('vehicleClassId') && !data.vehicleClassId && defaultVehicleClass) {
        data.vehicleClassId = defaultVehicleClass.getId();
    }
    if (step.urlPart !== 'summary') {
        return data;
    }
    const { passenger } = bookingContext.data;
    const clientUserId = passenger ? Number(passenger) : currentUser && currentUser.id;
    if (!clientUserId) {
        return data;
    }
    const run = async () => {
        try {
            const {
                driverInstructions: driverNotes,
                internalInstructions: officeNotes,
            } = await api.listRouteGet(User, 'booking-notes', { clientUserId });
            return {
                driverNotes,
                officeNotes,
                ...data,
            };
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Failed to get booking notes for client', clientUserId, e);
            return data;
        }
    };
    return run();
}

function modalStateReducer(state, action) {
    switch (action.type) {
        case 'showLoginRegister':
            return { visibleModal: 'loginRegister' };
        case 'showAccountSetup':
            return { visibleModal: 'account', userCreated: action.userCreated };
        case 'close':
            return { visibleModal: null };
        default:
            throw new Error(`Invalid action ${action.type}`);
    }
}

export default function CreateBookingController({ currentStep, baseUrl, location, match }) {
    const [bookingState, setBookingState] = useCreateBookingState();
    const {
        bookReturnTrip,
        accessibleSteps,
        bookingContext,
        furthestStepAvailable,
        validateStep,
        completeBooking,
        initialDataError,
        isInitialDataLoading,
        clearBookingState,
        completedBooking,
    } = useCreateUpdateBookingController(currentStep, [
        bookingState,
        setBookingState,
        setBookingState,
    ]);

    const { goToStep, goNext, goPrevious } = useCreateUpdateBookingNavigation({
        baseUrl,
        currentStep,
        furthestStepAvailable,
    });

    const { isMobile } = useBreakpoint();
    const supportsWebp = useWebp();
    const [{ visibleModal, userCreated }, dispatch] = useReducer(modalStateReducer, {
        visibleModal: null,
    });
    const closeModal = () => dispatch({ type: 'close' });
    const showAccountSetup = created =>
        dispatch({ type: 'showAccountSetup', userCreated: created });
    const showLoginRegister = () => dispatch({ type: 'showLoginRegister' });
    const activeAccount = useActiveAccount();
    const formActions = useFormActions(currentStep.getFormName());
    const handleLoginSuccess = async (response, created = false) => {
        // Need to reinitialize form so that it gets the booking notes for current user
        // when on summary page - but do it always in case any other pages end up depending
        // ont user
        const initialValues = await getFormInitialValues(
            currentStep,
            bookingContext,
            response.user
        );
        formActions.initialize(initialValues);

        // getFormInitialValues(currentStep, bookingContext, loggedInUser)
        // response here is the return value from the `login` action
        // If user has an account we can close the modal
        if (response.activeAccount) {
            closeModal();
        } else {
            showAccountSetup(created);
        }
    };
    const handleRegisterSuccess = async response => {
        return handleLoginSuccess(response, true);
    };

    // When form has submitted and there's errors, scroll to error
    const focuseError = useElementFocus(false, { containerSelector: '.has-error' });

    const loggedInUser = useSelector(User.selectors.currentUser);

    const saveStep = useCallback(
        ({ _submitAction, goToNext = true, ignoreErrors = false, ...data }) => {
            const finalData = { ...pick(data, currentStep.dataKeys.toArray()), goToNext };
            const extraKeys = Object.keys(data).filter(key => !(key in finalData));
            if (extraKeys.length) {
                // eslint-disable-next-line no-console
                console.warn(
                    `Extra keys in data: ${extraKeys.join(
                        ', '
                    )}. This data has been ignored. Add these to 'dataKeys' on the step ${
                        currentStep.name
                    }`
                );
            }
            const nextState = {
                ...bookingState,
                ...finalData,
            };
            if (currentStep.isCompleteBookingStep()) {
                return completeBooking(nextState).then(() => {
                    goNext();
                    setBookingState({});
                });
            }
            return validateStep(nextState, currentStep)
                .then(() => {
                    setBookingState(nextState);
                    goToNext && goNext();
                })
                .catch(error => {
                    // For recalculating price for additional stops we ignore errors
                    // such as validation on additional stops themselves
                    if (!ignoreErrors) {
                        throw error;
                    }
                });
        },
        [currentStep, bookingState, validateStep, completeBooking, setBookingState, goNext]
    );
    if (isInitialDataLoading) {
        return null;
    }
    if (initialDataError) {
        // eslint-disable-next-line no-console
        console.error(initialDataError);
        return <p>There was an unexpected error. Please refresh the page to try again.</p>;
    }
    // If current step isn't accessible we redirect to last accessible step.
    if (!accessibleSteps.includes(currentStep)) {
        return (
            <Redirect
                to={appendToUrl(baseUrl, accessibleSteps[accessibleSteps.length - 1].urlPart)}
            />
        );
    }

    const stepUrlFriendlyName = currentStep.name.replace(/\s+/g, '-').toLowerCase();

    const handleFormReset = () => {
        clearBookingState();
        window.location.reload();
    };

    const beforeErrorRender = errors => {
        const key = 'BookingErrorNotification';
        if (errors) {
            const description = (
                <ul>
                    {errors.map(error => (
                        <li>{error}</li>
                    ))}
                </ul>
            );
            notification.error({
                description,
                duration: 10,
                key,
                message: 'Cannot proceed with booking',
            });
        } else {
            notification.close(key);
        }
    };

    return (
        <React.Fragment>
            {currentStep.isFirst() && (
                <>
                    <Helmet>
                        <title>Limomate: Chauffeur Melbourne | Chauffeur Service Melbourne</title>
                        <meta
                            name="description"
                            content="LIMOMATE provides luxury chauffeurs for personal, private, airport transfers, events, and corporate uses in Melbourne. Contact us to book your trip today!"
                        />
                        <meta
                            name="keywords"
                            content="airport chauffeur cars, airport limousine Melbourne, limo service Melbourne, luxury taxi Melbourne, cars Melbourne, Melbourne, airport limo service, limo Melbourne airport, limo service Melbourne airport, limomate, limomate app, car service Melbourne, vha cars, vha cars Melbourne, vha Melbourne"
                        />
                    </Helmet>
                    <Hero type="home">
                        <Hero.Slide
                            image={supportsWebp ? HeroOneWebp : HeroOne}
                            heading="Why settle for less."
                            subHeading="Book your own driver."
                        />
                        <Hero.Slide
                            image={supportsWebp ? HeroTwoWebp : HeroTwo}
                            heading="You book the car. We do the rest"
                            subHeading="On time. Every time. Guaranteed"
                        />
                        <Hero.Slide
                            image={supportsWebp ? HeroThreeWebp : HeroThree}
                            heading="You book the car. We do the rest"
                            subHeading="On time. Every time. Guaranteed"
                        />
                        <Hero.Slide
                            image={supportsWebp ? HeroFourWebp : HeroFour}
                            heading="You book the car. We do the rest"
                            subHeading="On time. Every time. Guaranteed"
                        />
                    </Hero>
                </>
            )}
            {!currentStep.isFirst() && !(currentStep.isLast() && !loggedInUser) && !isMobile && (
                <React.Fragment>
                    <div className={styles.steps}>
                        <BookingSteps
                            goToStep={goToStep}
                            accessibleSteps={accessibleSteps}
                            steps={steps}
                            current={currentStep}
                            labelPlacement="vertical"
                        />
                    </div>
                </React.Fragment>
            )}
            <div
                data-testid="booking-container"
                className={`container step-${stepUrlFriendlyName} step-create`}
            >
                {React.createElement(currentStep.component, {
                    location,
                    match,
                    onSubmitFail: focuseError,
                    onSubmit: saveStep,
                    validate: data => currentStep.validate(data, bookingContext),
                    name: currentStep.getFormName(),
                    initialValues: getFormInitialValues(currentStep, bookingContext, loggedInUser),
                    headerBar: (
                        <CreateBookingButtonBar
                            header={currentStep.name}
                            {...{ currentStep, goPrevious }}
                            account={activeAccount}
                            onCreateOrLogin={showLoginRegister}
                            onAccountSetup={() => showAccountSetup()}
                        />
                    ),
                    footer: (
                        <CreateBookingButtonBar
                            {...{ currentStep, goPrevious }}
                            currentUser={loggedInUser}
                            account={activeAccount}
                            onCreateOrLogin={showLoginRegister}
                            onAccountSetup={() => showAccountSetup()}
                            clearForm={() => handleFormReset()}
                        />
                    ),
                    model: WriteOnlyBooking,
                    beforeErrorRender,
                    bookingContext,
                    clearBookingState,
                    completedBooking,
                    bookReturnTrip,
                    steps,
                    goToStep,
                    currentUser: loggedInUser,
                })}
            </div>
            <Modal
                onCancel={closeModal}
                title={null}
                footer={null}
                visible={visibleModal === 'loginRegister'}
                className="modal-md"
            >
                <LoginRegister
                    onLoginSuccess={handleLoginSuccess}
                    onRegisterSuccess={handleRegisterSuccess}
                />
            </Modal>
            <Modal
                onCancel={closeModal}
                title="Create billing account"
                footer={null}
                visible={visibleModal === 'account'}
                className="modal-md"
            >
                {userCreated && (
                    <Alert
                        type="success"
                        message="Congratulations, your client profile has been created. Please enter your credit card details to complete the booking."
                    />
                )}
                <ClientAccountFormProcessor onSuccess={closeModal} />
            </Modal>

            {currentStep.isFirst() && !loggedInUser && (
                <>
                    <section className="section-benefits">
                        <div className="container">
                            <Row type="flex" gutter={30}>
                                <Col xs={{ span: 24 }} md={{ span: 6 }}>
                                    <div className="section-benefits-content">
                                        <IconTick className="section-benefits-icon" />
                                        <h2>Reliable</h2>
                                        <p>
                                            Book for your preferred time and date and we commit to
                                            being there.
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 6 }}>
                                    <div className="section-benefits-content">
                                        <IconPillow className="section-benefits-icon" />
                                        <h2>Comfortable</h2>
                                        <p>
                                            Our vehicles are current model luxury sedans and People
                                            Movers that are maintained and presented to the highest
                                            standard.
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 6 }}>
                                    <div className="section-benefits-content">
                                        <IconOnTime className="section-benefits-icon" />
                                        <h2>On Time</h2>
                                        <p>
                                            More punctual than Qantas.
                                            <br />
                                            We guarantee that you’ll always be on time.
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 6 }}>
                                    <div className="section-benefits-content">
                                        <IconCleanliness className="section-benefits-icon" />
                                        <h2>COVID Safe</h2>
                                        <p>
                                            We have always maintained high standards of cleanliness
                                            and all of our drivers are accredited for COVID-19
                                            Hygiene practices.
                                            <br />
                                            <Link to="/covid-safe/">FIND OUT MORE</Link>
                                        </p>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </section>
                    <section className="testimonial-slider">
                        <TestimonialSlider>
                            <TestimonialSlider.Slide
                                image={supportsWebp ? SlideOneWebp : SlideOne}
                                quote="The Best. Have used them for years, professionally and privately. They have been reliable and punctual every time and very responsive when we’ve needed a last minute requirement."
                                cite="- Jürgen W. Schneider"
                            />
                            <TestimonialSlider.Slide
                                image={supportsWebp ? SlideTwoWebp : SlideTwo}
                                quote="Never ever been late, cars have always been top class. Drivers are always friendly and professional. Would never use taxi's again."
                                cite="- Christina Laria"
                            />
                            <TestimonialSlider.Slide
                                image={supportsWebp ? SlideThreeWebp : SlideThree}
                                quote="For over 10 years they have met all of my expectations, every time - professional, courteous, punctual. They always maintain clean cars and drivers are happy to help with your luggage to the car."
                                cite="- Silvana Ashford"
                            />
                        </TestimonialSlider>
                    </section>
                    <section className="front-main-content">
                        <div className="container">
                            <h1>Limomate: Chauffeur Melbourne</h1>
                            <Row type="flex" gutter={30}>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <p>
                                        Welcome to Melbourne. Whether you are travelling for
                                        business or pleasure, travel in comfort, style and safety
                                        with LIMOMATE. Book your own chauffeur driven vehicle and
                                        take the hassle out of your next trip – no more battling
                                        traffic or late taxis.
                                    </p>
                                    <p>
                                        You may wish to book a limo service to or from Melbourne
                                        Airport, to host guests, attend a function or you may simply
                                        be looking for a modern luxury car for your wedding day.
                                        Whatever the reason, LIMOMATE has got you covered.
                                    </p>
                                    <p>
                                        Our drivers are accredited and know Melbourne intimately.
                                        With our airport chauffeur car service, you’ll never be late
                                        for a flight again.
                                    </p>
                                </Col>
                                <Col xs={{ span: 24 }} md={{ span: 12 }}>
                                    <h2>We are reliable, punctual and on time.</h2>
                                    <p>
                                        Smart and sophisticated, our drivers pride themselves on
                                        making your journey enjoyable from start to finish, ensuring
                                        you can focus on what is really important - getting on with
                                        your plans. We can tailor the service to your needs and you
                                        can be assured you&apos;ll get a great chauffeur service in
                                        Melbourne, at very competitive rates.
                                    </p>
                                    <p>
                                        Simply choose the style of luxury car or limousine service
                                        you require. Book with Limomate and you can relax… and
                                        travel just the way you deserve.
                                    </p>
                                </Col>
                            </Row>
                        </div>
                    </section>
                    <section className="front-services">
                        <div className="container">
                            <h2>Choose Your Chauffeur Service Melbourne</h2>
                            <div className="services-grid">
                                <div>
                                    <Link to="/melbourne-airport-transfers/">
                                        <h3>Airport Transfers</h3>
                                        <img src={FixedPriceChauffeur} alt="" />
                                    </Link>
                                </div>
                                <div>
                                    <Link to="/chauffeur-services/private-chauffeur/">
                                        <h3>Private Chauffeur</h3>
                                        <img src={PrivateChauffeur} alt="" />
                                    </Link>
                                </div>
                                <div>
                                    <Link to="/chauffeur-services/weddings-events/">
                                        <h3>Weddings &amp; Social Events</h3>
                                        <img src={WeddingsEvents} alt="" />
                                    </Link>
                                </div>
                                <div>
                                    <Link to="/chauffeur-services/corporate-car-hire/">
                                        <h3>Corporate Car Hire</h3>
                                        <img src={CorporateHire} alt="" />
                                    </Link>
                                </div>
                                <div>
                                    <Link to="/chauffeur-services/sightseeing-tours/">
                                        <h3>Sightseeing Tours</h3>
                                        <img src={Sightseeing} alt="" />
                                    </Link>
                                </div>
                                <div>
                                    <Link to="/chauffeur-services/southern-cross-assist/">
                                        <h3>Southern Cross Assist</h3>
                                        <img src={SCAssist} alt="" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                    <CallToActionDownload />
                </>
            )}
        </React.Fragment>
    );
}

CreateBookingController.propTypes = {
    baseUrl: PropTypes.string.isRequired,
    currentStep: PropTypes.instanceOf(BookingStep).isRequired,
};
