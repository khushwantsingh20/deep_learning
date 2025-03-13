import { appendToUrl } from '@alliance-software/djrad/util/url';
import React from 'react';
import { Route, Switch } from 'react-router';
import CorporateCarHireView from './chauffeurservices/CorporateCarHireView';
import DelegationsView from './chauffeurservices/DelegationsView';
import PrivateChauffeurView from './chauffeurservices/PrivateChauffeurView';
import SightseeingToursView from './chauffeurservices/SightseeingToursView';
import SouthernCrossAssistView from './chauffeurservices/SouthernCrossAssistView';
import WeddingEventsView from './chauffeurservices/WeddingEventsView';
import ChauffeurServicesView from './ChauffeurServicesView';

function ServicesRoutes(props) {
    return (
        <Switch>
            <Route
                path={appendToUrl(props.match.url, 'private-chauffeur')}
                exact
                component={PrivateChauffeurView}
            />
            <Route
                path={appendToUrl(props.match.url, 'weddings-events')}
                exact
                component={WeddingEventsView}
            />
            <Route
                path={appendToUrl(props.match.url, 'corporate-car-hire')}
                exact
                component={CorporateCarHireView}
            />
            <Route
                path={appendToUrl(props.match.url, 'sightseeing-tours')}
                exact
                component={SightseeingToursView}
            />
            <Route
                path={appendToUrl(props.match.url, 'delegations')}
                exact
                component={DelegationsView}
            />
            <Route
                path={appendToUrl(props.match.url, 'southern-cross-assist')}
                exact
                component={SouthernCrossAssistView}
            />
            <Route component={ChauffeurServicesView} />
        </Switch>
    );
}

export default ServicesRoutes;
