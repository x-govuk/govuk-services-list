
require 'json'
require 'open-uri'


existing_services = []

Dir.glob('app/services/*.json') do |file|
  next if file.end_with?('_template.json')

  json = JSON.parse(File.read(file))
  json['file'] = file
  existing_services << json
end


existing_live_service_hosts = existing_services.collect do |existing_service|
  if existing_service['liveservice'].nil?
    nil
  else
    URI.parse(existing_service['liveservice']).host
  end
end.compact

count = 1000
start = 0
results = []
service_domains = []

while (start == 0 || results.count != 0) do

  file = URI.open("https://www.gov.uk/api/search.json?filter_format=transaction&count=#{count}&start=#{start}")

  json = JSON.parse(file.read)

  results = json['results']

  results.each do |result|
    content = JSON.parse(URI.open("https://www.gov.uk/api/content#{result['link']}").read)

    start_link = content['details']['transaction_start_link']
    next if start_link.nil?
    start_link_host = URI.parse(start_link).host
    next if start_link_host.nil?

    next if existing_live_service_hosts.include?(start_link_host)
    next if !start_link_host.end_with?("service.gov.uk")

    subdomain = start_link_host.split(".")[-4]

    start_page = "https://www.gov.uk" + result['link']

    new_json = {
      name: result['title'],
      description: content['description'],
      organisation: "** TODO **",
      theme: "** TODO **",
      phase: "** TODO **",
      liveservice: start_link,
      "start-page": start_page
    }

    organisations = content['links']['organisations']

    if organisations.to_a.count > 0
      new_json[:organisation] = organisations.first['title']
    end

    existing_service_with_same_start_page = existing_services.detect do |s|
      s['start-page'] == start_page
    end

    if existing_service_with_same_start_page

      File.open(existing_service_with_same_start_page['file'], 'w') do |f|

        json_to_write = existing_service_with_same_start_page
        json_to_write.delete("file")
        json_to_write[:liveservice] = start_link
        f.write JSON.pretty_generate(json_to_write)
      end

    else

      File.open("app/services/#{subdomain}.json", "w") do |f|
        f.write JSON.pretty_generate(new_json)
      end
    end

  end

  start += count
end
