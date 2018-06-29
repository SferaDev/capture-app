// @flow
import { fromPromise } from 'rxjs/observable/fromPromise';

import log from 'loglevel';
import errorCreator from 'capture-core/utils/errorCreator';
import { getEvents } from '../../../../events/eventRequests';
import getColumnsConfiguration from './getColumnsConfiguration';
import isSelectionsEqual from '../../../App/isSelectionsEqual';

import {
    actionTypes as mainSelectionActionTypes,
    workingListInitialDataRetrieved,
    workingListInitialRetrievalFailed,
} from '../mainSelections.actions';
import { actionTypes as paginationActionTypes } from './Pagination/pagination.actions';
import {
    actionTypes as eventsListActionTypes,
    workingListUpdateDataRetrieved,
    workingListUpdateRetrievalFailed,
} from './eventsList.actions';
import { actionTypes as newEventDataEntryActionTypes } from '../../NewEvent/DataEntry/newEventDataEntry.actions';
import { actionTypes as editEventDataEntryActionTypes } from '../../EditEvent/DataEntry/editEventDataEntry.actions';
import {
    batchActionTypes as connectivityBatchActionTypes,
    actionTypes as connectivityActionTypes,
} from '../../../Connectivity/connectivity.actions';
import { actionTypes as mainPageActionTypes } from '../mainPage.actions';
import { actionTypes as filterSelectorActionTypes } from './FilterSelectors/filterSelector.actions';

const errorMessages = {
    WORKING_LIST_RETRIEVE_ERROR: 'Working list could not be loaded',
    WORKING_LIST_UPDATE_ERROR: 'Working list could not be updated',
};

const getInitialWorkingListDataAsync = async (programId: string, orgUnitId: string, categories: { [key: string]: string}) => {
    const eventsPromise = getEvents({
        program: programId,
        orgUnit: orgUnitId,
        pageSize: 15,
        order: 'eventDate:desc',
        ...categories,
    });

    const columnsConfigPromise = getColumnsConfiguration(programId);

    const promiseData = await Promise.all([
        eventsPromise,
        columnsConfigPromise,
    ]);

    return {
        ...promiseData[0],
        columnsOrder: promiseData[1],
    };
};

const getUpdateWorkingListDataAsync = (
    programId: string,
    orgUnitId: string,
    rowsPerPage: number,
    currentPage: number,
    sortById: string,
    sortByDirection: string,
    categories: { [key: string]: string } = {},
    filters: { [key: string]: string },
) =>
    getEvents({
        program: programId,
        orgUnit: orgUnitId,
        pageSize: rowsPerPage,
        page: currentPage,
        order: `${sortById}:${sortByDirection}`,
        ...categories,
        filter: filters ?
            Object
                .keys(filters)
                .map(filterKey => `${filterKey}:${filters[filterKey]}`) : null,
    });

const getInitialWorkingListActionAsync = (
    programId: string,
    orgUnitId: string,
    categories: { [key: string]: string },
): Promise<ReduxAction<any, any>> =>
    getInitialWorkingListDataAsync(programId, orgUnitId, categories)
        .then(data =>
            workingListInitialDataRetrieved({ ...data, selections: { programId, orgUnitId, categories } }),
        )
        .catch((error) => {
            log.error(errorCreator(errorMessages.WORKING_LIST_RETRIEVE_ERROR)({ error }));
            return workingListInitialRetrievalFailed(errorMessages.WORKING_LIST_RETRIEVE_ERROR);
        });

const getUpdateWorkingListActionAsync = (
    programId: string,
    orgUnitId: string,
    rowsPerPage: number,
    currentPage: number,
    sortById: string,
    sortByDirection: string,
    categories: { [key: string]: string },
    filters: { [key: string]: string },
): Promise<ReduxAction<any, any>> =>
    getUpdateWorkingListDataAsync(programId, orgUnitId, rowsPerPage, currentPage, sortById, sortByDirection, categories, filters)
        .then(data =>
            workingListUpdateDataRetrieved(data),
        )
        .catch((error) => {
            log.error(errorCreator(errorMessages.WORKING_LIST_UPDATE_ERROR)({ error }));
            return workingListUpdateRetrievalFailed(errorMessages.WORKING_LIST_UPDATE_ERROR);
        });

const getArgumentsForUpdateWorkingListFromState = (state: ReduxState) => {
    const { programId, orgUnitId, categories } = state.workingListsContext.main;

    const currentMeta = state.workingListsMeta.main;
    const nextMeta = state.workingListsMeta.main.next;
    const { rowsPerPage, currentPage, sortById, sortByDirection, filters } = {
        ...currentMeta,
        ...nextMeta,
        filters: {
            ...currentMeta.filters,
            ...nextMeta.filters,
        },
    };

    return [
        programId,
        orgUnitId,
        rowsPerPage,
        currentPage,
        sortById,
        sortByDirection,
        categories,
        filters,
    ];
};

export const retrieveWorkingListOnMainSelectionsCompletedEpic = (action$: InputObservable, store: ReduxStore) =>
    // $FlowSuppress
    action$.ofType(
        mainSelectionActionTypes.MAIN_SELECTIONS_COMPLETED,
    )
        .switchMap(() => {
            const { programId, orgUnitId, categories } = store.getState().currentSelections;

            const initialPromise = getInitialWorkingListActionAsync(programId, orgUnitId, categories);
            return fromPromise(initialPromise)
                .takeUntil(
                    action$.ofType(
                        mainPageActionTypes.UPDATE_EVENT_LIST_AFTER_SAVE_OR_UPDATE_FOR_SINGLE_EVENT,
                        newEventDataEntryActionTypes.CANCEL_SAVE_UPDATE_WORKING_LIST,
                        editEventDataEntryActionTypes.UPDATE_WORKING_LIST_AFTER_CANCEL_UPDATE,
                        paginationActionTypes.CHANGE_PAGE,
                        paginationActionTypes.CHANGE_ROWS_PER_PAGE,
                        eventsListActionTypes.SORT_WORKING_LIST,
                    ),
                )
                .takeUntil(
                    action$
                        .ofType(connectivityBatchActionTypes.GOING_ONLINE_EXECUTED_BATCH)
                        .filter(actionBatch =>
                            actionBatch.payload.some(action => action.type === connectivityActionTypes.GET_EVENT_LIST_ON_RECONNECT)),
                );
        });

export const getWorkingListOnCancelSaveEpic = (action$: InputObservable, store: ReduxStore) =>
    // $FlowSuppress
    action$.ofType(
        newEventDataEntryActionTypes.CANCEL_SAVE_UPDATE_WORKING_LIST,
        editEventDataEntryActionTypes.UPDATE_WORKING_LIST_AFTER_CANCEL_UPDATE,
    )
        .switchMap(() => {
            const { programId, orgUnitId, categories } = store.getState().currentSelections;

            const initialPromise = getInitialWorkingListActionAsync(programId, orgUnitId, categories);
            return fromPromise(initialPromise)
                .takeUntil(
                    action$
                        .ofType(
                            mainSelectionActionTypes.MAIN_SELECTIONS_COMPLETED,
                            mainPageActionTypes.UPDATE_EVENT_LIST_AFTER_SAVE_OR_UPDATE_FOR_SINGLE_EVENT,
                            paginationActionTypes.CHANGE_PAGE,
                            paginationActionTypes.CHANGE_ROWS_PER_PAGE,
                            eventsListActionTypes.SORT_WORKING_LIST,
                        ),
                )
                .takeUntil(
                    action$
                        .ofType(connectivityBatchActionTypes.GOING_ONLINE_EXECUTED_BATCH)
                        .filter(actionBatch =>
                            actionBatch.payload.some(action => action.type === connectivityActionTypes.GET_EVENT_LIST_ON_RECONNECT)),
                );
        });

export const getWorkingListOnSaveEpic = (action$: InputObservable, store: ReduxStore) =>
    // $FlowSuppress
    action$.ofType(
        mainPageActionTypes.UPDATE_EVENT_LIST_AFTER_SAVE_OR_UPDATE_FOR_SINGLE_EVENT,
    )
        .switchMap(() => {
            const state = store.getState();
            const listSelections = state.workingListsContext.main;
            const { programId, orgUnitId, categories } = state.currentSelections;

            const cancelActionTypes = [
                mainSelectionActionTypes.MAIN_SELECTIONS_COMPLETED,
                newEventDataEntryActionTypes.CANCEL_SAVE_UPDATE_WORKING_LIST,
                editEventDataEntryActionTypes.UPDATE_WORKING_LIST_AFTER_CANCEL_UPDATE,
                paginationActionTypes.CHANGE_PAGE,
                paginationActionTypes.CHANGE_ROWS_PER_PAGE,
                eventsListActionTypes.SORT_WORKING_LIST,
            ];

            if (listSelections && isSelectionsEqual(listSelections, state.currentSelections)) {
                const argsForUpdate = getArgumentsForUpdateWorkingListFromState(state);
                const updatePromise = getUpdateWorkingListActionAsync(...argsForUpdate);
                return fromPromise(updatePromise)
                    .takeUntil(action$.ofType(...cancelActionTypes))
                    .takeUntil(
                        action$
                            .ofType(connectivityBatchActionTypes.GOING_ONLINE_EXECUTED_BATCH)
                            .filter(actionBatch =>
                                actionBatch.payload.some(action => action.type === connectivityActionTypes.GET_EVENT_LIST_ON_RECONNECT)),
                    );
            }

            const initialPromise = getInitialWorkingListActionAsync(programId, orgUnitId, categories);
            return fromPromise(initialPromise)
                .takeUntil(action$.ofType(...cancelActionTypes))
                .takeUntil(
                    action$
                        .ofType(connectivityBatchActionTypes.GOING_ONLINE_EXECUTED_BATCH)
                        .filter(actionBatch =>
                            actionBatch.payload.some(action => action.type === connectivityActionTypes.GET_EVENT_LIST_ON_RECONNECT)),
                );
        });

export const updateWorkingListEpic = (action$: InputObservable, store: ReduxStore) =>
    // $FlowSuppress
    action$.ofType(
        paginationActionTypes.CHANGE_PAGE,
        paginationActionTypes.CHANGE_ROWS_PER_PAGE,
        eventsListActionTypes.SORT_WORKING_LIST,
        filterSelectorActionTypes.SET_FILTER,
        filterSelectorActionTypes.CLEAR_FILTER,
    )
        .switchMap((action) => {
            const state = store.getState();
            const argsForUpdate = getArgumentsForUpdateWorkingListFromState(state);
            const updatePromise = getUpdateWorkingListActionAsync(...argsForUpdate);
            return fromPromise(updatePromise)
                .takeUntil(action$.ofType(
                    mainSelectionActionTypes.MAIN_SELECTIONS_COMPLETED,
                    newEventDataEntryActionTypes.CANCEL_SAVE_UPDATE_WORKING_LIST,
                    editEventDataEntryActionTypes.UPDATE_WORKING_LIST_AFTER_CANCEL_UPDATE,
                    mainPageActionTypes.UPDATE_EVENT_LIST_AFTER_SAVE_OR_UPDATE_FOR_SINGLE_EVENT,
                ))
                .takeUntil(
                    action$
                        .ofType(connectivityBatchActionTypes.GOING_ONLINE_EXECUTED_BATCH)
                        .filter(actionBatch =>
                            actionBatch.payload.some(action => action.type === connectivityActionTypes.GET_EVENT_LIST_ON_RECONNECT)),
                );
        });

export const getEventListOnReconnectEpic = (action$: InputObservable, store: ReduxStore) =>
    // $FlowSuppress
    action$.ofType(
        connectivityBatchActionTypes.GOING_ONLINE_EXECUTED_BATCH,
    )
        .filter(actionBatch =>
            actionBatch.payload.some(action => action.type === connectivityActionTypes.GET_EVENT_LIST_ON_RECONNECT))
        .switchMap(() => {
            const state = store.getState();

            const currentSelections = {
                programId: state.currentSelections.programId,
                orgUnitId: state.currentSelections.orgUnitId,
                categories: state.currentSelections.categories,
            };

            const listSelections = state.workingListsContext.main;

            const cancelActionTypes = [
                mainSelectionActionTypes.MAIN_SELECTIONS_COMPLETED,
                newEventDataEntryActionTypes.CANCEL_SAVE_UPDATE_WORKING_LIST,
                editEventDataEntryActionTypes.UPDATE_WORKING_LIST_AFTER_CANCEL_UPDATE,
                mainPageActionTypes.UPDATE_EVENT_LIST_AFTER_SAVE_OR_UPDATE_FOR_SINGLE_EVENT,
                paginationActionTypes.CHANGE_PAGE,
                paginationActionTypes.CHANGE_ROWS_PER_PAGE,
                eventsListActionTypes.SORT_WORKING_LIST,
            ];

            if (listSelections && isSelectionsEqual(listSelections, currentSelections)) {
                const argsForUpdate = getArgumentsForUpdateWorkingListFromState(state);
                const updatePromise = getUpdateWorkingListActionAsync(...argsForUpdate);
                return fromPromise(updatePromise)
                    .takeUntil(action$.ofType(...cancelActionTypes));
            }

            const initialPromise = getInitialWorkingListActionAsync(currentSelections.programId, currentSelections.orgUnitId, currentSelections.categories);
            return fromPromise(initialPromise)
                .takeUntil(action$.ofType(...cancelActionTypes));
        });
