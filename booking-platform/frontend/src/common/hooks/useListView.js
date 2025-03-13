import { useCallback, useState } from 'react';
import isEqual from 'lodash/isEqual';
import useListModel from '@alliance-software/djrad/hooks/useListModel';
import useUrlQueryState from '@alliance-software/djrad/hooks/useUrlQueryState';

export default function useListView(
    model,
    partialRecordFieldNames,
    {
        prefix = '',
        initialState = {},
        syncUrl = true,
        refetchOn = ['delete', 'add', 'update'],
        baseFilter = {},
        throwError = true,
    } = {}
) {
    const [urlFilters, setUrlFilters] = useUrlQueryState(initialState, { prefix });
    const [urllessFilters, setUrllessFilters] = useState(initialState);

    const filters = syncUrl ? urlFilters : urllessFilters;
    const setFilters = syncUrl ? setUrlFilters : setUrllessFilters;
    const { records, isLoading, error, run: refetch, pagination, extraData } = useListModel(
        model,
        { ...baseFilter, ...filters },
        {
            partialRecordFieldNames,
            refetchOn,
        }
    );
    if (error && throwError) {
        throw error;
    }
    const finalSetFilters = useCallback(
        data => {
            data = { ...data, page: '1' };
            // Always fetch data even if filters haven't changed
            if (isEqual(data, filters)) {
                refetch();
            } else {
                // reset to page 1 whenever filter changes
                setFilters(currentFilters => {
                    if (currentFilters.ordering) {
                        data.ordering = currentFilters.ordering;
                    }
                    return data;
                });
            }
        },
        [filters, refetch, setFilters]
    );
    const onTableChange = useCallback(
        (nextPagination, _filters, sorter) => {
            const currentPagination = pagination;
            const nextFilters = {};
            const { current, pageSize } = nextPagination;
            if (current !== currentPagination.current || pageSize !== currentPagination.pageSize) {
                Object.assign(nextFilters, { page: current, pageSize });
            }
            const { field, order } = sorter;
            if (field && order) {
                const ordering = (order === 'descend' ? '-' : '') + field;
                if (!filters.ordering !== ordering) {
                    nextFilters.ordering = ordering;
                }
            } else if (filters.ordering) {
                // Clear ordering
                nextFilters.ordering = null;
            }
            if (Object.keys(nextFilters).length > 0) {
                setFilters(currentFilters => ({
                    ...currentFilters,
                    ...nextFilters,
                }));
            }
        },
        [filters.ordering, pagination, setFilters]
    );

    return {
        setFilters: finalSetFilters,
        filters,
        records,
        isLoading,
        isInitialLoad: isLoading && !records,
        filterProps: {
            model,
            initialValues: filters,
            onSubmit: finalSetFilters,
        },
        tableProps: {
            data: records,
            loading: isLoading,
            pagination,
            onChange: onTableChange,
            model,
            sortedField: filters.ordering,
        },
        error,
        refetch,
        extraData,
    };
}
