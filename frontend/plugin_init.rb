Rails.application.config.after_initialize do
    Reformulator.configure(
      {
        "_global" => {
          "hideFields" => [
            {
              "selector" => 'select[name="resource[resource_type]"]',
              "hideClosestSelector" => '.form-group',
            },
            {
              "selector" => 'input[name="resource[ead_location]"]',
              "hideClosestSelector" => '.form-group',
            },
            {
              "selector" => 'textarea[name="resource[extents][0][physical_details]"]',
              "hideClosestSelector" => '.form-group',
            },
            {
              "selector" => 'textarea[name="resource[extents][0][dimensions]"]',
              "hideClosestSelector" => '.form-group',
            },
            {
              "selector" => 'textarea[name="resource[finding_aid_subtitle]"]',
              "hideClosestSelector" => '.form-group',
            },
            {
              "selector" => 'textarea[name="resource[finding_aid_filing_title]"]',
              "hideClosestSelector" => '.form-group',
            },
            {
              "selector" => 'textarea[name="resource[finding_aid_edition_statement]"]',
              "hideClosestSelector" => '.form-group',
            },
            {
              "selector" => 'textarea[name="resource[finding_aid_series_statement]"]',
              "hideClosestSelector" => '.form-group',
            },
            {
              "selector" => 'textarea[name="accession[extents][0][physical_details]"]',
              "hideClosestSelector" => '.form-group',
            },
            {
              "selector" => 'textarea[name="accession[extents][0][dimensions]"]',
              "hideClosestSelector" => '.form-group',
            },
            {
              "selector" => 'input[name="top_container[ils_holding_id]"]',
              "hideClosestSelector" => '.form-group',
            }
          ],
        },
        # rules for other controllers
      }
    )
  end
