import trim from 'lodash/trim';
import { BookingAddressType } from './choiceConstants';

export const SENTRY_ENABLED = !!window.__APP_CONTEXT__.sentry;
export const BASE_URL = `${trim(window.__APP_CONTEXT__.baseUrl, '/')}/`; // eslint-disable-line
export const BASE_API_URL = `${BASE_URL}api/`;

export const airportAddress = {
    addressType: BookingAddressType.AIRPORT.value,
    addressLabel: 'Airport',
    countryCode: 'AU',
    placeName: 'Melbourne Airport',
    mapUrl:
        'https://maps.google.com/?q=Melbourne+Airport+VIC+3045,+Australia&ftid=0x6ad658e2a697feeb:0x5045675218cd030',
    addressDetails: {
        addressComponents: {
            locality: {
                longName: 'Melbourne Airport',
                shortName: 'Melbourne Airport',
            },
            political: {
                longName: 'Australia',
                shortName: 'AU',
            },
            administrativeAreaLevel2: {
                longName: 'City of Hume',
                shortName: 'Hume',
            },
            administrativeAreaLevel1: {
                longName: 'Victoria',
                shortName: 'VIC',
            },
            country: {
                longName: 'Australia',
                shortName: 'AU',
            },
            postalCode: {
                longName: '3045',
                shortName: '3045',
            },
        },
        utcOffset: 600,
    },
    sourceId: 'ChIJ6_6XpuJY1moRMNCMIXVWBAU',
    formattedAddress: 'Melbourne Airport, VIC 3045, Australia',
    lat: -37.6697377,
    long: 144.8488148,
    postalCode: '3045',
    suburb: 'Melbourne Airport',
    isValidAddress: true,
};
