import { appendToUrl } from '@alliance-software/djrad/util/url';
import React from 'react';
import { Switch, Route } from 'react-router';
import PageNotFound from '../../../common/errors/PageNotFound';
import CreateBookingController from '../components/CreateBookingController';
import steps from '../steps';

const stepPattern = steps.map(step => step.urlPart).join('|');
const stepsByUrlPart = steps.reduce((acc, step) => {
    acc[step.urlPart] = step;
    return acc;
}, {});

export default function CreateBookingView({ match }) {
    return (
        <Switch>
            <Route
                path={appendToUrl(match.url, `:step(${stepPattern})`)}
                render={routeProps => {
                    const step = stepsByUrlPart[routeProps.match.params.step];
                    return (
                        <CreateBookingController
                            baseUrl={match.url}
                            currentStep={step}
                            {...routeProps}
                        />
                    );
                }}
            />
            <Route component={PageNotFound} />
        </Switch>
    );
}
