require 'open-uri'
require 'json'


existing_services = []

Dir.glob('app/services/*.json') do |file|
  next if file.end_with?('_template.json')

  json = JSON.parse(File.read(file))
  json['file'] = file
  existing_services << json
end

service_assessment_urls = []

existing_timeline_urls = existing_services.collect {|s| s["timeline"].to_h["items"].to_a.collect {|i| i["links"].to_a.collect {|l| l["href"] }}}.flatten

ignored_reports = [
  "https://www.gov.uk/service-standard-reports/national-parking-platform",
  "https://www.gov.uk/service-standard-reports/get-healthcare-cover-for-travelling-abroad",
  "https://www.gov.uk/service-standard-reports/nhs-digital-weight-management-programme-referral-hub",
  "https://www.gov.uk/service-standard-reports/record-a-patient-safety-event",
  "https://www.gov.uk/service-standard-reports/integrated-data-service",
  "https://www.gov.uk/service-standard-reports/prevent-duty-training-learn-how-to-safeguard-individuals-vulnerable-to-radicalisation-beta-assessment",
  "https://www.gov.uk/service-standard-reports/census-test-2017-beta-assessment",
  "https://www.gov.uk/service-standard-reports/office-for-national-statistics-ons-website-voluntary-service-assessment",
  "https://www.gov.uk/service-standard-reports/keep-notes-on-my-performance-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/nhs-uk",
  "https://www.gov.uk/service-standard-reports/adult-social-care-jobs",
  "https://www.gov.uk/service-standard-reports/find-and-manage-a-foster-placement",
  "https://www.gov.uk/service-standard-reports/apply-for-local-growth-funding",
  "https://www.gov.uk/service-standard-reports/non-domestic-renewable-heat-incentive-alpha-re-assessment-report",
  "https://www.gov.uk/service-standard-reports/non-domestic-renewable-heat-incentive-alpha-assessment-report",
  "https://www.gov.uk/service-standard-reports/apply-for-a-large-countryside-productivity-grant-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/check-your-energy-deal-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/check-your-energy-deal-alpha-reassessment",
  "https://www.gov.uk/service-standard-reports/civil-service-apprenticeships",
  "https://www.gov.uk/service-standard-reports/direct-debit-online-payment-service-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/dfe-developer-hub-alpha-reassessment-report",
  "https://www.gov.uk/service-standard-reports/pharmacy-returns-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/digital-submissions-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/adult-social-care-provider-information-return-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/adult-social-care-provider-information-return-alpha",
  "https://www.gov.uk/service-standard-reports/legal-advice-for-civil-servants-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/manage-your-referral",
  "https://www.gov.uk/service-standard-reports/your-nhs-pension",
  "https://www.gov.uk/service-standard-reports/maternity-exemption-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/check-local-environmental-data-for-agriculture-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/civil-service-learning-service-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/patient-appointment-booking-service",
  "https://www.gov.uk/service-standard-reports/civil-service-learning-course-booking-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/take-an-online-test-when-i-apply-for-a-job-in-the-civil-service-beta-reassessment-report",
  "https://www.gov.uk/service-standard-reports/prevent-e-learning-alpha-reassessment",
  "https://www.gov.uk/service-standard-reports/prevent-e-learning-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/take-an-online-test-when-i-apply-for-a-job-in-the-civil-service",
  "https://www.gov.uk/service-standard-reports/import-of-products-animals-food-and-feed-system-ipaffs-plant-journey",
  "https://www.gov.uk/service-standard-reports/the-centre-for-evaluation-and-monitoring-alpha-service-assessment-report",
  "https://www.gov.uk/service-standard-reports/express-an-interest-in-a-repatriation-flight-alpha-assessment-report",
  "https://www.gov.uk/service-standard-reports/readiness-reporting-and-deployability-discovery-alpha-assessment-report",
  "https://www.gov.uk/service-standard-reports/digital-trade-finance-service-alpha-assessment-report",
  "https://www.gov.uk/service-standard-reports/award-a-contract-for-goods-and-services-alpha-reassessment",
  "https://www.gov.uk/service-standard-reports/award-a-contract-for-goods-and-services-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/report-a-cyber-incident",
  "https://www.gov.uk/service-standard-reports/apply-for-the-armed-forces-compensation-and-war-pension-scheme",
  "https://www.gov.uk/service-standard-reports/nhs-jobs-get-a-job-with-the-nhs",
  "https://www.gov.uk/service-standard-reports/apply-for-a-maternity-exemption-certificate-beta-assessment",
  "https://www.gov.uk/service-standard-reports/dvla-webchat-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/electronic-data-collection-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/apply-for-healthy-start-alpha",
  "https://www.gov.uk/service-standard-reports/commercial-vehicle-service-alpha",
  "https://www.gov.uk/service-standard-reports/development-of-the-patient-safety-incident-management-system-dpsims-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/guaranteed-minimum-pension",
  "https://www.gov.uk/service-standard-reports/guaranteed-minimum-pension-beta-assessment",
  "https://www.gov.uk/service-standard-reports/check-your-self-employment-details",
  "https://www.gov.uk/service-standard-reports/new-secure-access-alpha-reassessment",
  "https://www.gov.uk/service-standard-reports/new-secure-access-alpha",
  "https://www.gov.uk/service-standard-reports/ukvi-contact-centre-procurement-beta-assessment",
  "https://www.gov.uk/service-standard-reports/identity-and-access-management-alpha",
  "https://www.gov.uk/service-standard-reports/ig-toolkit-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/overseas-healthcare-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/authorisation-service-agent-services-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/submit-monthly-contributions-for-nhs-pension-scheme-beta-assessment-report",
  "https://www.gov.uk/service-standard-reports/medical-examiners-examining-a-cause-of-death-alpha-reassessment",
  "https://www.gov.uk/service-standard-reports/register-for-cqc",
  "https://www.gov.uk/service-standard-reports/renewable-electricity-register-alpha-assessment-report",
  "https://www.gov.uk/service-standard-reports/contract-and-award-service-previous-name-award-a-contract-for-goods-and-services-alpha-reassessment",
  "https://www.gov.uk/service-standard-reports/apply-for-the-armed-forces-compensation-and-war-pension-schemes-service",
  "https://www.gov.uk/service-standard-reports/help-to-buy-apply-for-an-equity-loan-alpha-assessment-report",
  "https://www.gov.uk/service-standard-reports/prove-your-eligibility-to-a-foreign-government",
  "https://www.gov.uk/service-standard-reports/examining-a-cause-of-death-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/sign-up-to-report-your-income-and-expenses-quarterly-beta-assessment",
  "https://www.gov.uk/service-standard-reports/manage-my-adult-social-care-workforce-data-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/manage-key-stage-2-and-3-curriculum-resources-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/export-green-list-waste",
  "https://www.gov.uk/service-standard-reports/renewable-electricity-register-beta-reassessment-report",
  "https://www.gov.uk/service-standard-reports/renewable-electricity-register-beta-assessment-report"
]


page = 1
count = 0

while (page == 1 || count != 0)
  print "."
  file = URI.open("https://www.gov.uk/service-standard-reports.atom?page=#{page}")
  results = file.read
  links_regex = /\<link rel=\"alternate\" type=\"text\/html\" href=\"([^\"]+)\"\/>/

  new_links = (results.scan(links_regex).flatten - ["https://www.gov.uk"])
  count = new_links.count

  if count > 0
    service_assessment_urls = service_assessment_urls + new_links
  end
  page += 1
end


assessment_date_regex = /Assessment date\:\<\/td>\s+<td>([^<]+)<?/
stage_regex = /(alpha|beta|live)/i

ignored_words = [
  "alpha",
  "beta",
  "live",
  "service",
  "standard",
  "re\-assessment",
  "reassessment",
  "assessment",
  "report"
]

missing = 0

service_assessment_urls.each do |url|

  next if existing_timeline_urls.include?(url)
  next if ignored_reports.include?(url)

  api_url = url.gsub("https://www.gov.uk/", "https://www.gov.uk/api/content/")

  file = URI.open(api_url)

  json = JSON.parse(file.read)

  title = json["title"]

  ignored_words.each do |word|
    title.gsub!(/\b#{word}\b/i, '')
  end

  title.gsub!(" - ", "")
  title.gsub!(" – ", "")
  title.squeeze!(" ")
  title.strip!

  stage = json["title"].scan(stage_regex).flatten
  if stage == []
    stage = nil
  else
    stage = stage[0].downcase
  end

  assessment_date = json["details"]["body"].scan(assessment_date_regex)

  if assessment_date.length > 0
    assessment_date = Date.parse(assessment_date[0][0])
  else
    assessment_date = nil
  end

  existing_service = existing_services.detect {|s| s["name"].downcase.strip == title.downcase.strip} || existing_services.detect {|s| s["synonyms"].to_a.collect {|a| a.downcase.strip}.include? title.downcase.strip}

  if existing_service

    existing_service["timeline"] ||= {}
    existing_service["timeline"]["items"] ||= []


    existing_timeline_items = existing_service["timeline"]["items"].collect do |item|
      item["links"].to_a.collect {|link| link["href"] }
    end.flatten

    if !existing_timeline_items.include?(url)

      existing_service["timeline"]["items"] << {
        "label": "Passed|Did not pass #{stage} assessment",
        "date": assessment_date,
        "links": [
          {
            "href": url,
            "text": "service assessment report",
            "visuallyHiddenText": " for #{stage} assessment"
          }
        ]
      }


      File.open(existing_service['file'], 'w') do |f|

        json_to_write = JSON.parse(JSON.generate(existing_service))
        json_to_write.delete("file")

        f.write JSON.pretty_generate(json_to_write) + "\n"
      end
    end

  else
    missing += 1
    puts title
    puts url
    puts "-"
  end

end

puts "\n#{missing} service assessments missing"
