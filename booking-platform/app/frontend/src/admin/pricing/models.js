import ScbpModel from '../../core/model';
import { adminSite } from '../djradConfig';

export class BookingLeadTime extends ScbpModel {
    static getUrlPrefix() {
        return '/booking-lead-times/';
    }
}

adminSite.configureModel('scbp_core.bookingleadtime', { modelClass: BookingLeadTime });

export class DistanceOverride extends ScbpModel {
    static getUrlPrefix() {
        return '/distance-overrides/';
    }
}

adminSite.configureModel('scbp_core.distanceoverride', { modelClass: DistanceOverride });

export class PriceList extends ScbpModel {
    static getUrlPrefix() {
        return '/price-list/';
    }
}

adminSite.configureModel('scbp_core.pricelist', { modelClass: PriceList });

export class HourRateType extends ScbpModel {
    static getUrlPrefix() {
        return '/hour-rate-types/';
    }
}

adminSite.configureModel('scbp_core.hourratetype', { modelClass: HourRateType });

export class HolidayModel extends ScbpModel {
    static getUrlPrefix() {
        return '/holidays/';
    }
}

adminSite.configureModel('scbp_core.holiday', { modelClass: HolidayModel });

export class SpecialEvent extends ScbpModel {
    static getUrlPrefix() {
        return '/special-events/';
    }
}

adminSite.configureModel('scbp_core.specialevent', { modelClass: SpecialEvent });

export class PriceOverride extends ScbpModel {
    static getUrlPrefix() {
        return '/price-overrides/';
    }
}

adminSite.configureModel('scbp_core.priceoverride', { modelClass: PriceOverride });

export class PriceAdjustment extends ScbpModel {
    static getUrlPrefix() {
        return '/price-adjustments/';
    }
}

adminSite.configureModel('scbp_core.priceadjustment', { modelClass: PriceAdjustment });
