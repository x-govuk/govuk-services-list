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
  "https://www.gov.uk/service-standard-reports/your-nhs-pension"
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

puts "#{missing} service assessments missing"
