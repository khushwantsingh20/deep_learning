import { adminSite } from './djradConfig';

export { reducer as form } from 'redux-form';
export { default as Auth } from '../common/auth/reducer';

const djrad = adminSite.buildReducer('djrad');

export { djrad };

export { default as DispatchItems } from './dispatch/reducer';
