
# as_reformulator

An ArchivesSpace plugin that supports customizing forms by hiding fields and sections and setting values

Developed by Hudson Molonglo in collaboration with GAIA Resources and Recordkeeping Innovation
as part of the Queensland State Archives Digital Archiving Program.


## Configuration

Configure using `frontend/models/reformulator.rb`, add a new entry for the controller type (eg. `agents`), then using the id of the `<section>` element, add a new property (eg. `agent_corporate_entity_names`) with `show` and `defaultValues` arrays.
Entries in the `show` array are the segments of the id that are generated using its data-attributes. An empty array here indicates that all values should be hidden, as will the section header and if applicable, the menu sidebar link.
`defaultValues` entries are objects with a path array, and a value.
It should look something like this: 
```ruby
CONFIG =
  {"agents"=>
    {"agent_corporate_entity_names"=>
      {"show"=>
        [["agent_names_", "_authority_id_"],
         ["agent_names_", "_source_"],
         ["agent_names_", "_rules_"]],
       "defaultValues"=>
        [{"path"=>["agent_names_", "_source_"], "value"=>"local"}],
       "moveSectionAfter" => "basic_information",
        }}}

```
Once an entry is added, that section's fields will be hidden unless they have been added to `show` array.
For hiding fields in sub-sections, an entry will need to be added for both the `<section>` id and the field in the parent `<section>`.

The `defaultValues` property allows fields have have mandatory values added to them when hidden.

If given, `moveSectionAfter` will cause the current section to be
repositioned to sit after another section (specified by element ID).

