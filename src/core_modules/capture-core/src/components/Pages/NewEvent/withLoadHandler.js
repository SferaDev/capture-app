// @flow
/**
 * @namespace NewEventPage
 */
import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import LoadingMask from '../../LoadingMasks/LoadingMask.component';

const styles = () => ({
    loaderContainer: {
        display: 'flex',
        justifyContent: 'center',
    },
});

type Props = {
    isLoading: boolean,
    selectionsError: ?string,
    classes: {
        loaderContainer: string,
    }
};

const getLoadHandler = (InnerComponent: React.ComponentType<any>) =>
    class NewEventLoadHandler extends React.Component<Props> {
        render() {
            const { isLoading, selectionsError, classes, ...passOnProps } = this.props;

            if (isLoading) {
                return (
                    <div
                        className={classes.loaderContainer}
                    >
                        <LoadingMask />
                    </div>
                );
            }
            if (selectionsError) {
                return (
                    <div>
                        { selectionsError }
                    </div>
                );
            }

            return (
                <InnerComponent
                    {...passOnProps}
                />
            );
        }
    };

/**
 * HOC for newEvent component. Handling load status and load errors
 * @alias withLoadHandling
 * @memberof NewEventPage
 */

export default () => (InnerComponent: React.ComponentType<any>) =>
    withStyles(styles)(getLoadHandler(InnerComponent));