import { appSite } from './djradConfig';

export { reducer as form } from 'redux-form';
export { default as Auth } from '../common/auth/reducer';

const djrad = appSite.buildReducer('djrad');

export { djrad };
