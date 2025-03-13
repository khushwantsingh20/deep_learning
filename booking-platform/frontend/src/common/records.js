import { Numeric } from 'alliance-redux-api/lib/fieldTypes';
import { List, Record, Maybe, Union } from 'typed-immutable';

export const BookingPriceBreakdown = Record({
    formatted: List(
        Record({
            label: String,
            value: String,
        })
    ),
    // Maybe accounts for the absence of the base component for interstate bookings
    base: Maybe(
        Union(
            // One-way record
            Record({
                distance: Numeric,
                tier1: Numeric,
                tier2: Maybe(Numeric),
                tier3: Maybe(Numeric),
                carClass: Numeric,
                peak: Maybe(Numeric),
                outOfHours: Maybe(Numeric),
                holidayFee: Maybe(Numeric),
                airport: Maybe(Numeric),
                adjustment: Maybe(Numeric),
                subtotal: Numeric,
            }),
            // One-way special event record
            Record({
                distance: Numeric,
                eventMinimum: Numeric,
                subtotal: Numeric,
            }),
            // One-way price override record
            Record({
                distance: Numeric,
                special: Numeric,
                subtotal: Numeric,
            }),
            // Hourly record
            Record({
                time: String,
                firstHour: Numeric,
                tier1: Maybe(Numeric),
                tier2: Maybe(Numeric),
                carClass: Numeric,
                peak: Maybe(Numeric),
                outOfHours: Maybe(Numeric),
                holidayFee: Maybe(Numeric),
                airport: Maybe(Numeric),
                subtotal: Numeric,
            })
        )
    ),
    fees: Union(
        Record({
            government: Numeric,
            outOfArea: Maybe(Numeric),
            airportParking: Maybe(Numeric),
            event: Maybe(Numeric),
            subtotal: Numeric,
        }),
        Record({ interstate: Numeric, subtotal: Numeric })
    ),
    options: Record({
        ribbon: Numeric,
        childSeats: Numeric,
        color: Numeric,
        additionalStops: Numeric,
        carParkPass: Numeric,
        subtotal: Numeric,
    })({
        ribbon: 0,
        childSeats: 0,
        color: 0,
        additionalStops: 0,
        carParkPass: 0,
        subtotal: 0,
    }),
    rounding: Maybe(Record({ rounding: Numeric, subtotal: Numeric })),
    priceVariations: Maybe(
        Record({ items: List(List(Union(String, Numeric))), subtotal: Numeric })
    ),
    outOfPockets: Maybe(Record({ items: List(List(Union(String, Numeric))), subtotal: Numeric })),
    total: Numeric,
    eventName: Maybe(String),
});

export const LegacyBookingPriceBreakdown = Record({
    afterHoursSurcharge: Maybe(String),
    bookingFee: Maybe(String),
    carDriver: Maybe(String),
    creditCardSurcharge: Maybe(String),
    discount: Maybe(String),
    equipment: Maybe(String),
    kilometers: Maybe(String),
    standard: Maybe(String),
    total: Maybe(String),
    totalTrip: Maybe(String),
    variationFee: Maybe(String),
    variationText: Maybe(String),
    driverJobValue: Maybe(String),
});
