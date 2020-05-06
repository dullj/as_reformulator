
# as_reformulator

An ArchivesSpace plugin that supports customizing forms by hiding and reordering
fields and sections and setting default values for fields.

Developed by Hudson Molonglo in collaboration with GAIA Resources and
Recordkeeping Innovation as part of the Queensland State Archives Digital
Archiving Program project.


## Installation

To install the `as_reformulator` plugin follow this procedure:

  1. Download the latest version of the `as_reformulator` plugin into your
     `archivesspace/plugins/` directory
  2. Add `as_reformulator` to `AppConfig[:plugins]` in `config.rb`
  3. Add configuration to your frontend start up (see below)


## Configuration

The reformulator is configured via a call to `Reformulator.configure`. This can
be done in a plugin's `frontend/plugin_init.rb`. Here is an example
configuration showing all of the features available:

```ruby
  Rails.application.config.after_initialize do
    Reformulator.configure(
      {
        "_global" => {
          "hideFields" => [
            {
              "selector" => 'select[name="resource[level]"]',
              "hideClosestSelector" => '.form-group',
            },
            {
              "selector" => 'select[name*="[era]"]',
              "nameMustMatchRegex" => "date.*\\[era\\]",
              "hideClosestSelector" => '.form-group',
            },
            {
              "selector" => 'textarea[name*="[expression]"]',
              "nameMustMatchRegex" => "date.*\\[expression\\]",
              "hideClosestSelector" => '.form-group',
            },
          },
          "defaultValues" => [
            {
              "selector" => 'select[name="resource[level]"]',
              "value" => 'series',
            },
            {
              "selector" => 'select[name*="[date_type]"]',
              "nameMustMatchRegex" => "date.*\\[date_type\\]",
              "nameMustNotMatchRegex" => "(dates_of_existence|(mandate|function|event)\\[date\\])",
              "value" => 'inclusive',
            },
            {
              "selector" => 'select[name*="[date_type]"]',
              "nameMustMatchRegex" => "(dates_of_existence|mandate|function).*\\[date_type\\]",
              "value" => 'range',
            },
            {
              "selector" => 'input[name="resource[language]"]',
              "onlyIfEmpty" => true,
              "value" => 'eng',
            },
            {
              "selector" => 'input[name^="archival_object[physical_representations]"]',
              "nameMustMatchRegex" => ".*\\[title\\]",
              "valueSelector" => 'textarea[name="archival_object[title]"]',
              "onlyIfEmpty" => true,
            },
          },
        },
        "resources" => {
          "basic_information" => {
            "fieldOrder" => [
              {"path" => ["resource", "_id_"]},
              {"path" => ["resource", "_title_"]},
              {"path" => ["resource", "_abstract_"]},

              {"path" => ["archival_object", "_id_"]},
              {"path" => ["archival_object", "_title_"]},
              {"path" => ["archival_object", "_description_"]},
            ]
          },
          "sectionOrder" => [
            "resource_dates_",
            "resource_notes_",
            "resource_subjects_",

            "archival_object_dates_",
            "archival_object_subjects_",
          ],
          "sectionsToHide" => [
            "resource_related_accessions_",
            "finding_aid",

            "archival_object_linked_agents_",
            "archival_object_extents_",
          ],
          "resource_extents_" => {
            "defaultValues" => [
              {"path" => ["resource_extents_", "_number_"], "value" => "0"},
              {"path" => ["resource_extents_", "_extent_type_"], "value" => "volumes"},
            ]
          },
        },
        # rules for other controllers
      }
    )
  end
```

> NOTE: This example shows all of the available options. Defining these things
> can take some trial and error, looking at the page source and crafting
> expressions that reliably natch the desired elements, but which don't match
> too widely. The various options are there to help you refine the selection.

The entries at the top level of the configuration are for frontend controllers,
in the example there is only an entry for the `resources` controller. It also
has a `_global` entry that affects all controllers.

The `resources` controller was chosen in the example because it demonstrates a
complication that only applies to resources - the resources controller handles
`resource` records and `archival_object` records, since `archival_object`s are
always accessed in the context of their `resource` via the tree.

The `_global` entry can have two sub-entries - `hideFields` and `defaultValues`.
They do what you would expect and are often used together - you might not want
to use a mandatory field, so you hide it and give it a default value so that the
record validates correctly. There is no requirement to use them together in this
way.

The controller entries can have sub-entries for each section on the page, plus
a `sectionOrder` entry and a `sectionsToHide` entry. The `sectionOrder` entry is
an array of section ids. The sections listed will be moved in the order
specified under the `Basic Information` section. Any sections not listed will
come after in their original order.

The `sectionsToHide` entry is an array of section ids that will be hidden.

The entries for each section can have a `fieldOrder` sub-entry that specifies an
order for the fields within the section - using the same rules as for
`sectionOrder` described above. It can also have a `defaultValues` sub-entry
which allows you to specify default values for fields within the section.
