import ScbpModel from '../../core/model';
import { adminSite } from '../djradConfig';

export class Payment extends ScbpModel {
    static getUrlPrefix() {
        return '/payments/';
    }
}

adminSite.configureModel('scbp_core.paymentrecord', { modelClass: Payment });
