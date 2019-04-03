#
#  This is included as an example configuration
#  Either edit this file or copy it to your own plugin to configure the reformulator
#
# module Reformulator
#   CONFIG = {
#     "_global" => {
#       "hideFields" => [
#         {
#           "selector" => 'select[name*="[era]"]',
#           "nameMustMatchRegex" => "date.*\\[era\\]",
#           "hideClosestSelector" => '.form-group',
#         },
#         {
#           "selector" => 'select[name*="[calendar]"]',
#           "nameMustMatchRegex" => "date.*\\[calendar\\]",
#           "hideClosestSelector" => '.form-group',
#         },
#         {
#           "selector" => 'textarea[name*="[expression]"]',
#           "nameMustMatchRegex" => "date.*\\[expression\\]",
#           "hideClosestSelector" => '.form-group',
#         },
#         {
#           "selector" => 'select[name*="[date_type]"]',
#           "nameMustMatchRegex" => "date.*\\[date_type\\]",
#           "hideClosestSelector" => '.form-group',
#         },
#         {
#           "selector" => 'select[name="resource[resource_type]"]',
#           "hideClosestSelector" => '.form-group',
#         },
#         {
#           "selector" => '.extent-calculator-btn',
#         }
#       ],
#       "defaultValues" => [
#         {
#           "selector" => 'select[name*="[date_type]"]',
#           "nameMustMatchRegex" => "date.*\\[date_type\\]",
#           "nameMustNotMatchRegex" => "(dates_of_existence|(mandate|function)\\[date\\])",
#           "value" => 'inclusive',
#         },
#         {
#           "selector" => 'select[name*="[date_type]"]',
#           "nameMustMatchRegex" => "(dates_of_existence|mandate|function).*\\[date_type\\]",
#           "value" => 'range',
#         },
#         {
#           "selector" => 'select[name="resource[level]"]',
#           "value" => 'series',
#         },
#         {
#           "selector" => 'input[name="resource[language]"]',
#           "value" => 'eng',
#         }
#       ],
#     },

#     "resources" => {
#       "finding_aid" => {
#         "show" => [],
#       },
#       "resource_linked_agents_" => {
#         "show" => [],
#       },
#       "resource_extents_" => {
#         "show" => [],
#         "defaultValues" => [
#           {"path" => ["resource_extents_", "_number_"], "value" => "0"},
#           {"path" => ["resource_extents_", "_extent_type_"], "value" => "volumes"},
#           ]
#         },
#       "archival_object_linked_agents_" => {
#         "show" => [],
#       },
#       "archival_object_extents_" => {
#         "show" => [],
#         "defaultValues" => [
#           {"path" => ["archival_object_extents_", "_number_"], "value" => "0"},
#           {"path" => ["archival_object_extents_", "_extent_type_"], "value" => "volumes"},
#         ]
#       },
#     },

#     "agents" => {
#       "agent_corporate_entity_related_agents" => {
#         "show" => [],
#       },
#       "agent_corporate_entity_names" => {
#         "show" => [
#           ["agent_names_", "_primary_name_"],
#           ["agent_names_", "_subordinate_name_1_"],
#           ["agent_names_", "_subordinate_name_2_"]
#         ],
#         "defaultValues" => [
#           { "path" => ["agent_names_", "_source_"], "value" => "local" }
#         ],
#         "moveSectionAfter" => "basic_information",
#       },
#       "agent_corporate_entity_dates_of_existence" => {
#         "show" => [
#           ["agent_dates_of_existence_", "_begin_"],
#           ["agent_dates_of_existence_", "_end_"],
#           ["agent_dates_of_existence_", "_certainty_"],
#           ["agent_dates_of_existence_", "_date_notes_"]
#         ],
#         "defaultValues" => [
#           {"path" => ["agent_dates_of_existence_", "_date_type_"], "value" => "range"}
#         ]
#       }
#     },
#   }
# end
