import ScbpModel from '../../core/model';
import { adminSite } from '../djradConfig';
import { Account } from '../../common/user/models';

export class AccountToClient extends ScbpModel {}

adminSite.configureModel('scbp_core.account', { modelClass: Account });
adminSite.configureModel('scbp_core.accounttoclient', { modelClass: AccountToClient });
