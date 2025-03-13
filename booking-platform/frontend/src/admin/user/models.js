import { User, DriverUser, userRegistration } from '../../common/user/models';
import ScbpModel from '../../core/model';
import { adminSite } from '../djradConfig';

class StaffUser extends ScbpModel {
    static getUrlPrefix() {
        return '/staff/';
    }
}

export class ClientUser extends ScbpModel {
    static getUrlPrefix() {
        return '/clients/';
    }
}

adminSite.configureModel('scbp_core.user', userRegistration);

adminSite.configureModel('scbp_core.staffuser', { modelClass: StaffUser });
adminSite.configureModel('scbp_core.clientuser', { modelClass: ClientUser });
adminSite.configureModel('scbp_core.driveruser', { modelClass: DriverUser });

export { User, StaffUser };
