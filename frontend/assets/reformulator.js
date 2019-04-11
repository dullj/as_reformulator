class Reformulator {
    constructor (config, controller) {
        this.globalRules = config._global || {};
        this.config = config[controller] || {};
        this.controller = controller;

        $(document).on("loadedrecordform.aspace", () => { this.simplify(); });

        $(document).on("subrecordcreated.aspace", (event, objectName, subform) => {
            // In modals, `subform` can have multiple matches, which are not distinguishable from the subform torget we want.
            // So just process all of them
            subform.each((subformIndex, subformValue) => {
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
                this.applyGlobalRules(subform[0]);
            }
        });
    }

    simplify () {
        document.querySelectorAll('div.record-pane section')
            .forEach((section) => {
                const sectionId = section.id;
                const currentSectionConfig = this.config[sectionId];
                if (typeof currentSectionConfig === 'undefined') { return; }
                if (currentSectionConfig.moveSectionAfter) {
                    const targetSection = document.querySelector(`#${currentSectionConfig.moveSectionAfter}`);
                    if (targetSection) {
                        section.parentNode.removeChild(section);
                        targetSection.parentNode.insertBefore(section, targetSection.nextSibling);

			const sidebarLi = this.sidebarEntryForSection(sectionId);
			const targetSidebarLi = this.sidebarEntryForSection(currentSectionConfig.moveSectionAfter);
			const sidebarUl = sidebarLi.parentNode;
			sidebarUl.removeChild(sidebarLi);
			sidebarUl.insertBefore(sidebarLi, targetSidebarLi.nextSibling);
                    }
                }

                if (typeof currentSectionConfig.show !== 'undefined' && currentSectionConfig.show.length === 0) {
                    section.classList.add('hide');
                    const sidebarElement = this.sidebarEntryForSection(sectionId);
                    if (!!sidebarElement) {
                        sidebarElement.classList.add('hide');
                    }
                }
                this.parseSectionVisibility(section, currentSectionConfig);
            });

        this.applyGlobalRules(document);
    }

    sidebarEntryForSection(section) {
	// Return the <li> for the given section id.
	// Note that the basic_information section doesn't have the handy class, so or with href
	return document.querySelector(`li[class*='sidebar-entry-${section}'], li > a[href='#${section}']`).closest('li');
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
		const moveAfter = fieldSet.querySelector(`[for$='${fieldMatch.moveAfter}']`).closest('.form-group');
		const formGroup = sectionField.closest('.form-group');
		if (typeof moveAfter !== 'undefined') {
		    fieldSet.removeChild(formGroup);
		    fieldSet.insertBefore(formGroup, moveAfter.nextSibling);
		}
	    }
	}
    }

    parseSectionVisibility (section, config) {
	if (section.id == 'basic_information') {
	    section.querySelectorAll(".control-label:not([type='hidden'])").forEach(field => {
	        this.parseSectionFields(field, config, field.getAttribute('for'));
	    });
	    return;
	}

        // Check if it's a section or subsection
        const subsectionList = section.querySelector('ul.subrecord-form-list');
        if (subsectionList === null) {
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
            // Search for list indicies surrounded by double underscores. This is a workaround for fields that have `_<number>`
            // in their id
            const configFieldId = listField.id.split(/__[0-9]__/).join('__');
            if (listField.tagName === 'SECTION' && config.show.find(value => value.join('') === listField.id.replace(/_[0-9]+_/, ''))) {
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
        if (input.value !== value && input.value === '') {
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

        rootElement.querySelectorAll(rule.selector)
                   .forEach(element => {
                       if ((!rule.nameMustMatchRegex || element.name.match(rule.nameMustMatchRegex)) &&
                           (!rule.nameMustNotMatchRegex || !element.name.match(rule.nameMustNotMatchRegex))) {
                           result.push(element);
                       }
                    });

        return result;
    }

    applyGlobalRules (element) {
        // Set defaults as appropriate
        (this.globalRules.defaultValues || []).forEach(rule => {
            this.findElementsMatchingRule(element, rule).forEach(match => {
		this.setInputValueWithChangeEvent(match, this.defaultValueForRule(rule));
            });
        });

        // Hide fields marked for hiding
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
