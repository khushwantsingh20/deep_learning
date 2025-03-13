import ScbpModel from '../../core/model';
import { adminSite } from '../djradConfig';

export class VehicleClass extends ScbpModel {
    static getUrlPrefix() {
        return '/vehicle-class/';
    }
}

export class VehicleColor extends ScbpModel {
    static getUrlPrefix() {
        return '/vehicle-colour/';
    }
}

export class Vehicle extends ScbpModel {
    static getUrlPrefix() {
        return '/vehicle/';
    }
}

export class VehicleOperator extends ScbpModel {
    static getUrlPrefix() {
        return '/vehicle-operator/';
    }
}

adminSite.configureModel('scbp_core.vehiclecolor', { modelClass: VehicleColor });
adminSite.configureModel('scbp_core.vehicleclass', { modelClass: VehicleClass });
adminSite.configureModel('scbp_core.vehicle', { modelClass: Vehicle });
adminSite.configureModel('scbp_core.vehicleoperator', { modelClass: VehicleOperator });
