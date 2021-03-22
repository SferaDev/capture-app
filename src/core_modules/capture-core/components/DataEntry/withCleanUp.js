// @flow
import * as React from 'react';

const getCleanUpHOC = (InnerComponent: React.ComponentType<any>) =>
    (props: Object) => {
        const {
            onSearchGroupResultCountRetrieved,
            onSearchGroupResultCountRetrievalFailed,
            ...passOnProps
        } = props;

        return (
            <InnerComponent
                {...passOnProps}
            />
        );
    };

export const withCleanUpHOC = () =>
    (InnerComponent: React.ComponentType<any>) =>
        getCleanUpHOC(InnerComponent);
