import ScbpModel from '../../core/model';
import { adminSite } from '../djradConfig';

export class Invoice extends ScbpModel {
    static getUrlPrefix() {
        return '/invoices/';
    }
}

adminSite.configureModel('scbp_core.invoice', { modelClass: Invoice });
