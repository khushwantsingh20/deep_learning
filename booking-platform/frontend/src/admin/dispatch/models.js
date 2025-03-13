import ScbpModel from '../../core/model';
import { adminSite } from '../djradConfig';

export class DispatchBooking extends ScbpModel {
    static getUrlPrefix() {
        return '/dispatch/';
    }
}

adminSite.configureModel('scbp_core.dispatch', { modelClass: DispatchBooking });
