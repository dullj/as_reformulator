class Reformulator {
    constructor (config, controller) {
        this.globalRules = config._global || {};
        this.config = config[controller] || {};
        this.controller = controller;

        $(document).on("loadedrecordform.aspace", this.logExceptions(() => { this.simplify(); }));

        $(document).on("subrecordcreated.aspace", this.logExceptions((event, objectName, subform) => {
            // In modals, `subform` can have multiple matches, which are not distinguishable from the subform torget we want.
            // So just process all of them
            subform.each((subformIndex, subformValue) => {
                if (!subformValue.closest('ul.subrecord-form-list')) {
                    console.error("closest('ul.subrecord-form-list ') returned null for element",
                                  subformValue);
                    return;
                }

                const idPath = subformValue.closest('ul.subrecord-form-list').dataset.idPath;
                const index = subformValue.closest('ul.subrecord-form-list li').dataset.index;
                const subsectionId = this.getItemPath(idPath, index);
                // Dirty hack for getting the correct config name.
                const splitConfigNames = idPath.split(/[0-9]+/);
                const topmostSection = subformValue.closest('form fieldset > section');
                if (!topmostSection) {
                    return;
                }
                const topmostSectionId = topmostSection.id;
                const configSection = this.config[topmostSectionId];

                if (typeof configSection === 'undefined' || typeof configSection.show === 'undefined') {
                    return;
                }

                this.config[topmostSectionId].show.forEach(showFieldNames => {
                    if (Array.isArray(showFieldNames) &&
                        showFieldNames.filter(element => splitConfigNames.map(
                            element => element.replace('${index}_', '')).includes(element))
                    ) {
                        this.parseSubsectionVisibility(subformValue, this.config[topmostSectionId], subsectionId);
                    }
                });
            });

            if (subform[0]) {
                this.logExceptions(() => { this.applyGlobalRules(subform[0]); })();
            }
        }));
    }


    // Return a version of `fn` with exceptions caught & logged
    logExceptions (fn) {
        return (...args) => {
            try {
                return fn(...args);
            } catch (e) {
                console.error(e);
                return null;
            }
        };
    }


    simplify () {
        // make sure we have a form to reformulate
        if (document.querySelector('div.record-pane') == null) { return }

        // make sure we're not double handling
        if (document.querySelector('div.record-pane').classList.contains('reformulator-simplified-me')) { return }

        // reorder sections
        if (this.config.hasOwnProperty("sectionOrder")) {
            // basic_information is always first, so we'll be rearranging sections under it
            var basicInformation = document.querySelector('#basic_information');

            // some sections are nested in their own readonly context,
            // so we'll need to know who the real parent is
            var parentContainer = basicInformation.parentElement;

            // we'll also be reordering the sidebar so get the bits we'll need
            var basicInformationSidebarEntry = this.sidebarEntryForSectionId('basic_information');
            var sidebarContainer = basicInformationSidebarEntry.parentElement;

            var orderedSections = this.config.sectionOrder.slice(0).reverse();
            orderedSections.forEach(sectionId => {
                if (sectionId == "basic_information") {
                    console.warn("Reformulator is ignoring basic_information in sectionOrder");
                    return;
                }

                var section = document.querySelector(`#${sectionId}`);

                if (!!section) {
                    // find the element that we're going to move
                    var mover = section;
                    // it might be one of those pesky nested sections
                    // so walk up the tree until we get to the correct level
                    while (mover.parentElement != parentContainer) {
                        mover = mover.parentElement;
                    }

                    parentContainer.removeChild(mover);
                    parentContainer.insertBefore(mover, basicInformation.nextElementSibling);
                }

                // order the sidebar
                var sidebarMover = this.sidebarEntryForSectionId(sectionId);
                if (!!sidebarMover) {
                    sidebarContainer.removeChild(sidebarMover);
   			            sidebarContainer.insertBefore(sidebarMover, basicInformationSidebarEntry.nextElementSibling);
			          }
            });
        }

        // hide sections
        if (this.config.hasOwnProperty("sectionsToHide")) {
            this.config.sectionsToHide.forEach(sectionId => {
                var section = document.querySelector(`#${sectionId}`);

                if (!!section) {
                    section.classList.add('hide');
                    const sidebarEntry = this.sidebarEntryForSectionId(sectionId);
                    if (!!sidebarEntry) {
                        sidebarEntry.classList.add('hide');
                    }
                }
            });
        }


        document.querySelectorAll('div.record-pane section, div.subrecord-form-container section')
            .forEach((section) => {
                const sectionId = section.id;
                const currentSectionConfig = this.config[sectionId];
                if (typeof currentSectionConfig === 'undefined') { return; }

                this.parseSectionVisibility(section, currentSectionConfig);
            });

        this.applyGlobalRules(document);

        document.querySelector('div.record-pane').classList.add('reformulator-simplified-me');
    }


    sidebarEntryForSectionId(sectionId) {
      var sidebarSelector = 'div#archivesSpaceSidebar';
      var sb =  document.querySelector(`${sidebarSelector} li[class*='sidebar-entry-${sectionId}'], ${sidebarSelector} li > a[href='#${sectionId}']`);
      return sb ? sb.closest('li') : false;
    }


    parseSectionFields (sectionField, config, configFieldId) {
        if (typeof config.show !== 'undefined') {
            const flatConfig = config.show.map(element => Array.isArray(element) ? element.join('') : element);
            if (!flatConfig.includes(configFieldId)) {
                if (sectionField.tagName === 'SECTION') {
                    sectionField.classList.add('hide');
                } else {
                    // Get the parent div or section to hide
                    sectionField.closest('.form-group,section').classList.add('hide');
                }
            }
        }

        // Add default values from config
        if (config.hasOwnProperty('defaultValues')) {
            const defaultMatch = config.defaultValues.find(value => value.path.join('') === configFieldId);
            const defaultValue = this.defaultValueForRule(defaultMatch);
            if (typeof defaultValue !== 'undefined') {
                switch (sectionField.tagName) {
                    case 'SELECT':
                        if (!Array.apply(null, sectionField.options).map(option => option.value).includes(defaultValue)) {
                            throw new Error('Value provided does not match values listed in the target select element');
                        } else {
                            this.setInputValueWithChangeEvent(sectionField, defaultValue);
                        }
                        break;
                    case 'INPUT':
                        if (sectionField.type === 'checkbox' && typeof defaultValue !== 'boolean') {
                            throw new Error(`Expected checkbox value to be boolean, but found: ${defaultValue}`);
                        }
                    case 'TEXTAREA':
                        this.setInputValueWithChangeEvent(sectionField, defaultValue);
                        break;
                    default:
                        throw new Error(`Unexpected field tag: ${sectionField.tagName}`);
                }
            }
        }

        // Apply field moves from config
        if (config.hasOwnProperty('fieldMoves')) {
            const fieldMatch = config.fieldMoves.find(value => value.path.join('') === configFieldId);
            if (typeof fieldMatch !== 'undefined') {
                const section = sectionField.closest('section');
                const fieldSet = sectionField.closest('fieldset, .subrecord-form-fields, .form-horizontal, section');
                const moveAfterLabel = fieldSet.querySelector(`[for$='${fieldMatch.moveAfter}']`)
                if (moveAfterLabel != null) {
                    const moveAfter = moveAfterLabel.closest('.form-group');
                    const formGroup = sectionField.closest('.form-group');
                    if (typeof moveAfter !== 'undefined') {
                        const parentContainer = formGroup.parentElement;
                        parentContainer.removeChild(formGroup);
                        parentContainer.insertBefore(formGroup, moveAfter.nextSibling);
                    }
                }
            }
        }
    }


    parseSectionVisibility (section, config) {
        if (config.hasOwnProperty('fieldOrder')) {
            // the slice(0) here is powerful foo that clones the array rather than mutating it
            // which is what reverse() very conveniently does ...
            var orderedFields = config.fieldOrder.slice(0).reverse();
            orderedFields.forEach(fld => {
                var start_match = fld.path.slice(0, Math.max(1, fld.path.length - 1)).join();
                var end_match = fld.path[fld.path.length - 1];
                var label = section.querySelector(`.control-label[for^=${start_match}][for$=${end_match}]`);

                if (!!label) {
                    var elt = label.parentElement;
                    var parent = elt.parentElement;
                    parent.removeChild(elt);
                    parent.insertBefore(elt, parent.querySelector('.form-group'));
                }
            });
        }

        if (section.id == 'basic_information') {
            section.querySelectorAll(".control-label:not([type='hidden'])").forEach(fieldLabel => {
                let field = fieldLabel.parentElement.querySelector(`#${fieldLabel.getAttribute('for')}`);

                if (field == null) {
                    field = fieldLabel;
                }

                this.parseSectionFields(field, config, fieldLabel.getAttribute('for'));
            });
            return;
        }

        // Check if it's a section or subsection
        const subsectionList = section.querySelector('ul.subrecord-form-list');
        if (subsectionList === null) {
            return;
        }

        if (config.hasOwnProperty('show') && config.show.length === 0) {
            subsectionList.classList.add('hide');
            return;
        }

        const subsectionListItems = subsectionList.querySelectorAll('li');

        if (typeof subsectionListItems !== 'undefined' && subsectionListItems.length > 0) {
            subsectionListItems.forEach((subsectionListItem) => {
                // Get subsection prefix, and ensure it's not a hidden field
                const subsectionId = this.getItemPath(subsectionList.dataset.idPath, subsectionListItem.dataset.index);
                this.parseSubsectionVisibility(subsectionListItem, config, subsectionId);
            });
        }
    }


    parseSubsectionVisibility (subsectionListItem, config, subsectionId) {
        // Look for matching subsection id prefix, and ensure that it is not a hidden field
        const listFields = subsectionListItem.querySelectorAll("[id^='" + subsectionId + "_']:not([type='hidden'])");
        listFields.forEach(listField => {
            // Support subfields
            // Search for list indicies surrounded by double underscores.
            // This is a workaround for fields that have `_<number>` in their id
            const configFieldId = listField.id.split(/__\d+__/).join('__');
            if (listField.tagName === 'SECTION' &&
                config.hasOwnProperty('show') &&
                config.show.find(value => value.join('') === listField.id.replace(/_[0-9]+_/, ''))) {
                listField.classList.add('hide');
            } else {
                this.parseSectionFields(listField, config, configFieldId);
            }
        });
    }


    getItemPath (idPath, index) {
        return idPath.replace('${index}', index);
    }


    setInputValueWithChangeEvent (input, value) {
        if (input.value !== value) {
            input.value = value;

            if (input.closest('.combobox-container')) {
                // Comboboxes use a hidden input for the actual value, but need
                // their display element updated to make the value visible to the user.
                const selectId = input.name.replace('[', '_').replace(']', '_');
                const label = document.querySelector(`#${selectId} option[value="${value}"]`).innerText;

                input.closest('.combobox-container').querySelector('input[type=text]').value = label;
            }

            setTimeout(() => input.dispatchEvent(new Event('change')));
        }
    }


    defaultValueForRule(rule) {
        if (!rule) { return undefined; }

        if (rule.hasOwnProperty('valueSelector')) {
            return document.querySelector(rule.valueSelector).value;
        } else {
            return rule.value;
        }
    }


    findElementsMatchingRule (rootElement, rule) {
        const result = [];

        rootElement.querySelectorAll(rule.selector).forEach(element => {
            if ((!rule.nameMustMatchRegex || element.name.match(rule.nameMustMatchRegex)) &&
                (!rule.nameMustNotMatchRegex || !element.name.match(rule.nameMustNotMatchRegex)) &&
                (!rule.onlyIfEmpty || !element.value)) {
                result.push(element);
            }
        });

        return result;
    }


    applyGlobalRules (element) {
        // set default values
        (this.globalRules.defaultValues || []).forEach(rule => {
            this.findElementsMatchingRule(element, rule).forEach(match => {
                this.setInputValueWithChangeEvent(match, this.defaultValueForRule(rule));
            });
        });

        // hide
        (this.globalRules.hideFields || []).forEach(rule => {
            this.findElementsMatchingRule(element, rule).forEach(match => {
                const hideMe = rule.hideClosestSelector ? match.closest(rule.hideClosestSelector) : match;

                if (hideMe && !hideMe.matches('.hide')) {
                  hideMe.classList.add('hide');
                }
            });
        });
    }
}
