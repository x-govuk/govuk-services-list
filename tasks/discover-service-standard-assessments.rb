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
title_regex = /(?: \- )?(alpha|beta|live) (?:service\s)?(?:re)?\-?assessment(?: report)?/i

service_assessment_urls.each do |url|

  next if existing_timeline_urls.include?(url)

  api_url = url.gsub("https://www.gov.uk/", "https://www.gov.uk/api/content/")

  file = URI.open(api_url)

  json = JSON.parse(file.read)

  title = json["title"]

  title = title.gsub(title_regex, "")
  stage = json["title"].scan(title_regex).flatten
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
    puts title
    puts url
    puts "-"
  end

end
