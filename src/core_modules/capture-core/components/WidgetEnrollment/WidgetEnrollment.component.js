// @flow
import React, { useState, useCallback } from 'react';
import moment from 'moment';
import { IconClock16, colors } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { withStyles } from '@material-ui/core';
import { Widget } from '../Widget';
import type { Props } from './enrollmentComponent.types';

const styles = {
    icon: {
        color: colors.grey700,
    },
};


export const WidgetEnrollmentPlain = ({ classes, enrollment = {} }: Props) => {
    const [open, setOpenStatus] = useState(true);

    return (
        <div
            data-test="enrollment-widget"
        >
            <Widget
                header={i18n.t('Enrollment')}
                onOpen={useCallback(() => setOpenStatus(true), [setOpenStatus])}
                onClose={useCallback(() => setOpenStatus(false), [setOpenStatus])}
                open={open}
            >
                <span className={classes.icon} data-test="enrollment-widget-icon-clock" >
                    <IconClock16 />
                </span>
                {moment(enrollment.lastUpdated).fromNow()}
            </Widget>
        </div>
    );
};

export const WidgetEnrollment: ComponentType<$Diff<Props, CssClasses>> = withStyles(styles)(WidgetEnrollmentPlain);
