
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

ignored_start_pages = File.read("tasks/ignored_start_page_urls.txt").split("\n")

file = URI.open("https://www.gov.uk/api/search.json?filter_format=transaction&count=#{count}&start=#{start}")

print "."
json = JSON.parse(file.read)

results = json['results']

start_pages = results.collect {|x| "https://www.gov.uk" + x['link'] } - ignored_start_pages

missing_start_pages = start_pages.select do |start_page|

  match = existing_services.detect {|service| Array(service['start-page']).include?(start_page) }

  !match
end

puts "#{missing_start_pages.size} missing start pages: "
puts missing_start_pages.sort
