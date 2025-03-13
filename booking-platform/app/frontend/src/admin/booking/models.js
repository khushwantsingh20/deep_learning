import ScbpModel from '../../core/model';
import { adminSite } from '../djradConfig';

export class Booking extends ScbpModel {
    static getHtmlTitle() {
        return 'Find Bookings';
    }

    static getPageHeader() {
        return 'Find Bookings';
    }

    static getUrlPrefix() {
        return '/bookings/';
    }
}

export class ClientAddress extends ScbpModel {}
export class BookingLog extends ScbpModel {}
export class GuestTraveller extends ScbpModel {}

adminSite.configureModel('scbp_core.booking', { modelClass: Booking });
adminSite.configureModel('scbp_core.clientaddress', { modelClass: ClientAddress });
adminSite.configureModel('scbp_core.bookinglog', { modelClass: BookingLog });
adminSite.configureModel('scbp_core.guesttraveller', { modelClass: GuestTraveller });
