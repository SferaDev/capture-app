// @flow
import { typeof dataElementTypes } from '../../../../../metaData';

export type EventsMainProperties = { [eventId: string]: Object, eventId: string };
export type EventsDataElementValues = { [eventId: string]: Object};

export type ColumnMetaForDataFetching = {|
    id: string,
    type: $Values<dataElementTypes>,
    apiName?: string,
    isMainProperty?: boolean,
|};

export type ColumnsMetaForDataFetching = Map<string, ColumnMetaForDataFetching>;

export type CustomColumnOrder = Array<{| id: string, visible: string |}>;

export type ClientConfig = {|
    filters: { [id: string]: any },
    sortById: string,
    sortByDirection: string,
    currentPage: number,
    rowsPerPage: number,
    customColumnOrder?: CustomColumnOrder,
|};

export type EventWorkingListsTemplate = {|
    id: string,
    isDefault?: ?boolean,
    name: string,
    access: {
        update: boolean,
        delete: boolean,
        write: boolean,
        manage: boolean,
    },
    criteria?: Object,
    nextCriteria?: Object,
    notPreserved?: boolean,
    deleted?: boolean,
    skipInitDuringAddProcedure?: boolean,
|};

export type EventWorkingListsTemplates = Array<EventWorkingListsTemplate>;

export type ColumnConfigBase = {
    id: string,
    visible: boolean,
    type: $Values<dataElementTypes>,
    header: string,
    options?: ?Array<{text: string, value: any}>,
    multiValueFilter?: boolean,
};
export type MetadataColumnConfig = {
    ...ColumnConfigBase,
};

export type MainColumnConfig = {
    ...ColumnConfigBase,
    isMainProperty: true,
    apiName?: string,
};

export type EventWorkingListsColumnConfig = MetadataColumnConfig | MainColumnConfig;

export type EventWorkingListsColumnConfigs = Array<EventWorkingListsColumnConfig>;
