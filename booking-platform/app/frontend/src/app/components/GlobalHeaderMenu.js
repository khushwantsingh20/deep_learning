import { RootEventListener } from 'alliance-react';
import { Icon } from 'antd';
import React, { useCallback, useState } from 'react';
import { withRouter } from 'react-router';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import useBreakpoint from '../../common/hooks/useBreakpoint';
import styles from './GlobalHeader.less';
import BookDriverButton from './BookDriverButton';

const links = [
    {
        to: '/',
        label: 'Home',
        subnav: [],
    },
    {
        to: '/our-story/',
        label: 'About',
        subnav: [],
    },
    {
        to: '#',
        label: 'Services',
        subnav: [
            {
                to: '/melbourne-airport-transfers/',
                label: 'Airport Transfers',
                subnav: [],
            },
            {
                to: '/chauffeur-services/',
                label: 'Chauffeur Services',
                subnav: [
                    {
                        to: '/chauffeur-services/private-chauffeur/',
                        label: 'Private Chauffeur',
                    },
                    {
                        to: '/chauffeur-services/corporate-car-hire/',
                        label: 'Corporate Car Hire',
                    },
                    {
                        to: '/chauffeur-services/sightseeing-tours/',
                        label: 'Sightseeing Tours',
                    },
                    {
                        to: '/chauffeur-services/delegations/',
                        label: 'Delegations',
                    },
                    {
                        to: '/chauffeur-services/southern-cross-assist/',
                        label: 'Southern Cross Assist',
                    },
                ],
            },
            {
                to: '/chauffeur-services/weddings-events/',
                label: 'Wedding Cars',
                subnav: [],
            },
        ],
    },
    {
        to: '/contact/',
        label: 'Contact',
        subnav: [],
    },
];

function MenuItem({ to, label, dropdown, location, setMenuOpen }) {
    const [itemOpen, setItemOpen] = useState(false);
    const rootOnClick = useCallback(() => setItemOpen(false), [setItemOpen]);

    React.useEffect(() => {
        if (location) {
            rootOnClick();
            setMenuOpen(false);
        }
    }, [location, rootOnClick, setMenuOpen]);

    return (
        <RootEventListener onClick={rootOnClick}>
            <li>
                <div className={styles.menuLink}>
                    {to === '#' ? (
                        <button className={styles.btnAsLink} onClick={() => setItemOpen(!itemOpen)}>
                            {label}
                            <Icon type="caret-down" />
                        </button>
                    ) : (
                        <>
                            <NavLink to={to}>{label}</NavLink>
                            {dropdown && dropdown.length > 0 && (
                                <button onClick={() => setItemOpen(!itemOpen)}>
                                    <Icon type="caret-down" />
                                </button>
                            )}
                        </>
                    )}
                </div>

                {itemOpen && dropdown && dropdown.length > 0 && (
                    <ul className={styles.submenu}>
                        {dropdown.map(
                            ({ to: subNavTo, label: subNavLabel, subnav: subNavLevel }) => (
                                <MenuItem
                                    key={subNavTo}
                                    to={subNavTo}
                                    label={subNavLabel}
                                    dropdown={subNavLevel}
                                    setMenuOpen={setMenuOpen}
                                />
                            )
                        )}
                    </ul>
                )}
            </li>
        </RootEventListener>
    );
}

MenuItem.propTypes = {
    to: PropTypes.string,
    label: PropTypes.string,
    dropdown: PropTypes.array,
    setMenuOpen: PropTypes.func,
};

function GlobalHeaderMenu({ showLoginLink, ...rest }) {
    const { isMobile } = useBreakpoint();
    const [menuOpen, setMenuOpen] = useState(!isMobile);

    const userState = showLoginLink ? styles.loggedOut : styles.loggedIn;

    const { location } = rest;

    return (
        <>
            {isMobile && (
                <button
                    className={`${styles.mainMenuBtn} ${userState}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-expanded={menuOpen ? 'true' : 'false'}
                >
                    <Icon type="menu" /> Menu{' '}
                    <a
                        href="tel:1300 12 54 66"
                        onClick={e => e.stopPropagation()}
                        className={styles.tel}
                    >
                        <Icon type="phone" /> 1300 12 LIMO
                    </a>
                </button>
            )}
            <nav {...rest} aria-hidden={menuOpen ? 'false' : 'true'} className={styles.menu}>
                <div onClick={e => e.stopPropagation()}>
                    <ul>
                        {links.map(({ to, label, subnav }) => (
                            <MenuItem
                                key={to}
                                to={to}
                                label={label}
                                dropdown={subnav}
                                location={location}
                                setMenuOpen={setMenuOpen}
                            />
                        ))}
                        <li key="bookNow" className={styles.bookBtn}>
                            <BookDriverButton type="primary" />
                        </li>
                    </ul>
                </div>
            </nav>
        </>
    );
}

GlobalHeaderMenu.propTypes = {
    /** If true will show link to login page */
    showLoginLink: PropTypes.bool,
};

export default withRouter(GlobalHeaderMenu);
