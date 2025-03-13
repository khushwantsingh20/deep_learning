import { PermanentCache } from 'alliance-redux-api/lib/fetchCache';
import ScbpModel from '../../core/model';
import { appSite } from '../djradConfig';

/**
 * This model is just used in creation process and so is write only. Later we
 * will have another Booking model that is used for reading / writing existing
 * bookings.
 */
export class WriteOnlyBooking extends ScbpModel {}

export class VehicleClass extends ScbpModel {}

export class GuestTraveller extends ScbpModel {}

appSite.configureModel('scbp_core.writeonlybooking', {
    modelClass: WriteOnlyBooking,
});

appSite.configureModel('scbp_core.vehicleclass', {
    modelClass: VehicleClass,
    // Don't need to fetch this more than once
    cache: new PermanentCache(),
});

appSite.configureModel('scbp_core.guesttraveller', {
    modelClass: GuestTraveller,
});
