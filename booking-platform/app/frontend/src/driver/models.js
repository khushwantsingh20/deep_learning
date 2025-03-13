import { driverSite } from './djradConfig';
import ScbpModel from '../core/model';

export class Booking extends ScbpModel {}

driverSite.configureModel('scbp_core.booking', { modelClass: Booking });
