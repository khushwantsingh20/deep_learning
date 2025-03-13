import ScbpModel from '../../core/model';
import { adminSite } from '../djradConfig';

export class Statement extends ScbpModel {
    static getUrlPrefix() {
        return '/statements/';
    }
}

adminSite.configureModel('scbp_core.accountstatement', { modelClass: Statement });
