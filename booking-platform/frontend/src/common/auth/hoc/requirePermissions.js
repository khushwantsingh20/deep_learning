import React from 'react';
import CheckPermission from '@alliance-software/djrad/components/permissions/CheckPermission';
import PermissionDenied from '../../errors/PermissionDenied';

/**
 * Wrap a component with a permission check.
 *
 * Example:
 *
 * List action permission:
 *  function DistributorListView(props) {
 *      ...
 *  }
 *  export default requirePermission(DistributorListView, { model: Distributor, action: 'list' })
 *
 * Update action permission where the record is passed on the 'distributor' prop
 *
 *  function DistributorUpdateView(props) {
 *      ...
 *  }
 *  export default requirePermission({ recordProp: 'distributor', action: 'update' })(DistributorUpdateView)
 *
 *  Arbitrary permission check
 *
 *   function MyComponent(props) {
 *
 *   }
 *   export default requirePermission({ perm: 'some.permission.to.check' )(MyComponent);
 *
 * @param options {Object} Extra props passed through to [CheckPermission](https://djrad.herokuapp.com/components/CheckPermission/). Note that
 * you should not pass component/render or children.
 * @param options.recordProp For object permission checks this should be the name of the prop that will contain the record
 * @param options.modelProp For global model permission checks this should be the name of the prop that will contain the model class
 * @returns {function(*): *}
 */
export default function requirePermissions({
    recordProp,
    component,
    render,
    children,
    modelProp,
    model,
    ...rest
}) {
    return WrappedComponent => {
        if (component || render || children) {
            throw new Error(
                'You cannot pass component, render or children through to requirePermissions'
            );
        }
        if (modelProp && model) {
            throw new Error('Only one of modelProp and model should be provided');
        }

        // We don't care about propTypes on this, disable lint on it
        // eslint-disable-next-line
        function EnhancedComponent({ forwardedRef, ...props }) {
            const checkPermProps = { model, ...rest };
            if (recordProp) {
                checkPermProps.record = props[recordProp];
            }
            if (modelProp) {
                checkPermProps.model = props[modelProp];
            }
            return (
                <CheckPermission
                    permissionDeniedComponent={PermissionDenied}
                    {...checkPermProps}
                    render={() => <WrappedComponent ref={forwardedRef} {...props} />}
                />
            );
        }

        return React.forwardRef((props, ref) => (
            <EnhancedComponent {...props} forwardedRef={ref} />
        ));
    };
}
