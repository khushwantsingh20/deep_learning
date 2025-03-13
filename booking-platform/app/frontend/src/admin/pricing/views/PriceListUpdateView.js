import { modelListRoute } from '@alliance-software/djrad/actions';
import Breadcrumb from '@alliance-software/djrad/components/breadcrumbs/Breadcrumb';
import UrlDrivenTabs from '@alliance-software/djrad/components/UrlDrivenTabs';
import useGetModel from '@alliance-software/djrad/hooks/useGetModel';
import { message } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import AdminPageHeader from '../../components/AdminPageHeader';
import FullPageLoading from '../../../common/misc/FullPageLoading';
import PricingUpdateForm from '../components/PricingUpdateForm';
import { PriceList } from '../models';

const { TabPane } = UrlDrivenTabs;

function getCurrentPriceList(model) {
    return modelListRoute('get', model, 'current');
}

function getFuturePriceList(model) {
    return modelListRoute('get', model, 'future');
}

function PriceListView({ future }) {
    const action = future ? getFuturePriceList : getCurrentPriceList;
    const { isLoading, error, record, run: refetchPriceList } = useGetModel(PriceList, null, {
        action,
    });

    const onSuccess = () => {
        message.success('Price list updated');
        // Each save creates a new version of the price list so we refetch it here
        refetchPriceList();
    };

    if (error) {
        // Handled somewhere above in ResponseErrorBoundary
        throw error;
    }
    if (isLoading) {
        return <FullPageLoading />;
    }

    return (
        <>
            <h2>{future ? 'Future' : 'Current'} Price List</h2>
            <PricingUpdateForm future={future} record={record} onSuccess={onSuccess} />
        </>
    );
}

PriceListView.propTypes = {
    future: PropTypes.bool,
};

function PriceListUpdateView(props) {
    return (
        <div>
            <Breadcrumb to={props.match.url}>Update price list</Breadcrumb>
            <AdminPageHeader htmlTitle="Price settings" header="Price settings" />
            <UrlDrivenTabs defaultActiveKey="current">
                <TabPane tab="Current Price List" url="current">
                    <PriceListView />
                </TabPane>
                <TabPane tab="Future Price List" url="future">
                    <PriceListView future />
                </TabPane>
            </UrlDrivenTabs>
        </div>
    );
}

export default PriceListUpdateView;
