// @flow

export const getDataEntryHasChanges = (state: ReduxState, key: string) => {
    const reduced = Object.keys(state.formsSectionsFieldsUI)
        .filter(formSectionUI => formSectionUI.startsWith(key))
        .reduce((accElementsUI, sectionKey) => [...accElementsUI, ...Object.keys(state.formsSectionsFieldsUI[sectionKey]).map(elementKey => state.formsSectionsFieldsUI[sectionKey][elementKey])], []);

    const formIsModified = reduced.some(element => element.modified);

    if (formIsModified) {
        return true;
    }

    const UIDataForDataValues = state.dataEntriesFieldsUI[key];
    const dataEntryIsModified = UIDataForDataValues ? Object
        .keys(UIDataForDataValues)
        .some(elementKey => UIDataForDataValues[elementKey].modified) : false;

    return dataEntryIsModified;
};
