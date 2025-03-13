import ScbpModel from '../../core/model';
import { adminSite } from '../djradConfig';

export class DriverRevenue extends ScbpModel {
    static getUrlPrefix() {
        return '/driver-revenue/';
    }
}

adminSite.configureModel('scbp_core.driverrevenue', { modelClass: DriverRevenue });

export class DriverStatement extends ScbpModel {
    static getUrlPrefix() {
        return '/driver-statements/';
    }
}

adminSite.configureModel('scbp_core.driverstatement', { modelClass: DriverStatement });
