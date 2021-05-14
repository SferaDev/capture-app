// @flow
import React from 'react';
import { IconCross16, IconUndo16, MenuItem } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import type { Props } from './cancel.types';
import { plainStatus } from '../../constants/status.const';

export const Cancel = ({ enrollment, mutate }: Props) =>
    (enrollment.status === plainStatus.CANCELLED ? (
        <MenuItem
            dense
            onClick={async () =>
                mutate({
                    ...enrollment,
                    status: plainStatus.ACTIVE,
                })
            }
            icon={<IconUndo16 />}
            label={i18n.t('Reactivate')}
        />
    ) : (
        <MenuItem
            dense
            onClick={async () =>
                mutate({
                    ...enrollment,
                    status: plainStatus.CANCELLED,
                })
            }
            icon={<IconCross16 />}
            destructive
            label={i18n.t('Mark as cancelled')}
        />
    ));
