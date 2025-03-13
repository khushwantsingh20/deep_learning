import useGetModel from '@alliance-software/djrad/hooks/useGetModel';
import React from 'react';
import PropTypes from 'prop-types';
import { modelClass } from '@alliance-software/djrad/prop-types/model';
import Breadcrumb from '@alliance-software/djrad/components/breadcrumbs/Breadcrumb';
import { stripIndent } from 'common-tags';
import { isValidElementType } from 'react-is';
import { Switch, Route } from 'react-router';

import PageNotFound from '../../common/errors/PageNotFound';
import FullPageLoading from '../../common/misc/FullPageLoading';
import CreateView from './CreateView';
import DeleteView from './DeleteView';
import UpdateView from './UpdateView';
import DetailView from './DetailView';
import ListView from './ListView';

// Mapping of action name to default component
const defaultViews = {
    list: ListView,
    create: CreateView,
    detail: DetailView,
    update: UpdateView,
    delete: DeleteView,
};

/**
 * Validate the view for an action is valid
 * @param action {String} name of the action
 * @param ActionView {Function} the component to use for action
 */
function validateActionView(action, ActionView) {
    if (isValidElementType(ActionView)) {
        return;
    }
    if (ActionView !== undefined) {
        throw new Error(
            stripIndent`Invalid action mapping provided for action ${action}. Should be a React component`
        );
    }
    throw new Error(
        stripIndent`Custom action ${action} has no view specified. To provide one pass the 'actionComponents' prop to 'ModelCrud', eg.

        <ModelCrud
             actionComponents={{ ${action}: MyCustomActionComponent }} />
        />

        To prevent this action from having a frontend route pass false:

        <ModelCrud
             excludeActions={['${action}']}
        />
    `
    );
}

/**
 * Routes that apply to a single instance of the model and sit under the url
 *   /<model base>/:id/
 * Any extra object level actions should go here.
 */
function DetailRoutes({
    model,
    excludeActions,
    inexactActionRoutes,
    match,
    actionComponents,
    renderForm,
}) {
    const { isLoading, error, record } = useGetModel(model, match.params.id);
    if (error) {
        // Handled somewhere above in ResponseErrorBoundary
        throw error;
    }
    if (isLoading) {
        return <FullPageLoading />;
    }
    if (!record) {
        // This will happen on a delete - record will be removed from redux and this
        // re-render before the redirect has happened. In effect this just stops an
        // error - it shouldn't change how the UI works.
        return null;
    }
    const routes = [
        ...model._meta.actions.object
            .filter(action => !excludeActions.includes(action))
            .map(action => {
                const url = model.getActionPattern(action);
                const ActionView = actionComponents[action] || defaultViews[action];
                validateActionView(action, ActionView);
                const extraProps = {};
                if (renderForm && action === 'update') {
                    extraProps.renderForm = renderForm;
                }
                return (
                    <Route
                        key={action}
                        exact={!inexactActionRoutes.includes(action)}
                        path={url}
                        render={routeProps => (
                            <ActionView {...routeProps} {...extraProps} record={record} />
                        )}
                    />
                );
            }),
        <Route key="404" component={PageNotFound} />,
    ];
    return (
        <>
            <Breadcrumb to={model.getActionUrl('detail', { id: record.id })}>
                {record.__str__}
            </Breadcrumb>
            <Switch>{routes}</Switch>
        </>
    );
}

/**
 * Setup default CRUD routing for a model.
 *
 * Sets up routes for all known global actions (ie. actions that don't require a record) and
 * all object actions (ie. actions that operate on a record). Routes are named according to
 * the model class setting. To change the base URL used for a model implement getUrlPrefix
 * on the relevant model.
 *
 * By default all actions specified on the ModelRegistration class for a model are included. To exclude
 * some when routes aren't required pass the excludeActions prop. See `defaultViews` in this file
 * for the default components used for each route. You can override these by passing a component
 * in `actionComponents`.
 *
 * If you have custom actions (ie. not one of list, create, detail, update, delete) then you
 * need to either provide the component to use for that route in actionComponents or pass
 * the action in excludedActions.
 *
 * For example lets say you had two custom actions on User - activate and sendInvitation. Let us
 * also say you wanted a route for sendInvitation but activate was going to be implemented inline
 * on the listing view so a specific route wasn't required. In addition lets replace the default
 * listing view with a custom one for User. You would achieve that with:
 *
 *    <ModelCrud
 *        model={User}
 *        actionComponents={{
 *            list: UserListingView,
 *            sendInvitation: UserSendInvitationView,
 *        }}
 *        excludeActions={['activate']}
 *    />
 */
export default function ModelCrud({
    model,
    renderForm,
    excludeActions = [],
    inexactActionRoutes = [],
    actionComponents = {},
    sideMenuCollapsed = false,
}) {
    const { actions } = model._meta;
    const routes = [
        // Any global level actions (create, list etc) should come first
        ...actions.global
            .filter(action => !excludeActions.includes(action))
            .map(action => {
                const url = model.getActionPattern(action);
                const ActionView = actionComponents[action] || defaultViews[action];
                validateActionView(action, ActionView);
                const extraProps = { sideMenuCollapsed };
                if (renderForm && action === 'create') {
                    extraProps.renderForm = renderForm;
                }
                return (
                    <Route
                        key={action}
                        exact={!inexactActionRoutes.includes(action)}
                        path={url}
                        render={routeProps => (
                            <ActionView {...routeProps} {...extraProps} model={model} />
                        )}
                    />
                );
            }),
        <Route
            key="detailRoutes"
            path={model.getObjectActionPatternPrefix()}
            render={routeProps => (
                <DetailRoutes
                    renderForm={renderForm}
                    model={model}
                    excludeActions={excludeActions}
                    actionComponents={actionComponents}
                    inexactActionRoutes={inexactActionRoutes}
                    {...routeProps}
                />
            )}
        />,
        <Route key="404" component={PageNotFound} />,
    ];
    return (
        <>
            <Breadcrumb to={model.getActionUrl('list')}>{model._meta.labelPlural}</Breadcrumb>
            <Switch>{routes}</Switch>
        </>
    );
}

ModelCrud.propTypes = {
    /**
     * List of model actions that you want in-exact route matching on. This lets you nest routes
     * underneath them. Without this routes must be exact and anything extra will result in a
     * 404.
     *
     * eg. If you had a list route you wanted to then nest a UrlDrivenTabs under you might set this
     * to ['list']. Then these URL's would work:
     *
     * /users/list/tab1/
     * /users/list/tab2/
     * ...
     *
     */
    inexactActionRoutes: PropTypes.arrayOf(PropTypes.string),
    /**
     * List of actions to _not_ generate routes for.
     */
    excludeActions: PropTypes.arrayOf(PropTypes.string),
    /**
     * The model the CRUD screens are for
     */
    model: modelClass().isRequired,
    /**
     * Mapping from an action name string (eg. 'update') to a component to use
     */
    actionComponents: (props, propName, componentName) => {
        const value = props[propName];
        if (value) {
            if (typeof value != 'object') {
                throw new Error(
                    `${propName} on ${componentName} must be a mapping from action name to a component`
                );
            }
            const model = props.model;
            // If we don't have model bail here and let the model prop type raise an error
            if (!model) {
                return;
            }
            const invalidActions = [];
            const invalidComponentActions = [];
            Object.entries(value).forEach(([actionName, component]) => {
                if (!model._meta.isValidAction(actionName)) {
                    invalidActions.push(actionName);
                } else if (!isValidElementType(component)) {
                    invalidComponentActions.push(actionName);
                }
            });
            const errors = [];
            if (invalidActions.length > 0) {
                errors.push(
                    `'${propName}' on ${componentName} was passed invalid actions ${invalidActions.join(
                        ', '
                    )}`
                );
            }
            if (invalidComponentActions.length > 0) {
                errors.push(
                    `'${propName}' on ${componentName} was passed invalid components for the actions ${invalidComponentActions.join(
                        ', '
                    )}. Check the component has been exported correctly.`
                );
            }
            if (errors.length > 0) {
                throw new Error(errors.join('\n'));
            }
        }
    },
    /** If provided is used as the default form renderer for update and create views */
    renderForm: PropTypes.func,
};

DetailRoutes.propTypes = ModelCrud.propTypes;
