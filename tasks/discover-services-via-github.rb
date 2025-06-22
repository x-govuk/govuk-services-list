require 'octokit'
require 'uri'
require 'json'

# Token needs no privileges at all.
client = Octokit::Client.new(:access_token => ENV.fetch('GITHUB_ACCESS_TOKEN'))

ignored_url_hosts = File.read("tasks/ignored-urls.txt").split("\n")
  .collect {|line| URI.parse(line).host }

organisations = ['alphagov', 'cabinetoffice', 'communitiesuk', 'DFE-Digital', 'department-for-transport', 'hmrc', 'dwp', 'defra', 'dfid', 'MHRA', 'ministryofjustice', 'ukforeignoffice', 'UKHomeOffice', 'UKGovernmentBEIS', 'companieshouse', 'decc', 'dvla', 'dvsa', 'insolvencyservice', 'intellectual-property-office', 'LandRegistry', 'MHRA', 'OfqualGovUK', 'SkillsFundingAgency', 'publichealthengland', 'hmcts', 'department-of-health', 'uktrade', 'mcagov', 'HMPO', 'Planning-Inspectorate', 'digital-land', 'FoodStandardsAgency']

repos = []

organisations.each do |org|
  repos.concat(client.repositories(org, per_page: 100))

  page = 1

  while page < 500 do
    puts "#{org} page #{page}"

    next_url = client.last_response.rels[:next]

    break if next_url.nil?

    repos.concat(client.get(next_url.href))
    page += 1
  end
end

existing_services = []

Dir.glob('app/services/*.json') do |file|
  next if file.end_with?('_template.json')

  json = JSON.parse(File.read(file))
  json['file'] = file
  existing_services << json
end



repos.each do |repo|

  if repo.homepage
    begin
      homepage_url = URI.parse(repo.homepage)
    rescue URI::InvalidURIError
      next
    end

    if homepage_url.host.to_s.end_with?(".gov.uk")

      next if homepage_url.host.to_s.include?('docs.')
      next if homepage_url.host.to_s.include?('blog.')
      next if homepage_url.host.to_s.include?('design-history')
      next if homepage_url.host.to_s.include?('guide')
      next if ignored_url_hosts.include?(homepage_url.host)

      existing_service_with_same_url = existing_services.detect do |s|
        s['liveService'] &&
        URI.parse(s['liveService']).host == homepage_url.host
      end

      if existing_service_with_same_url

        if existing_service_with_same_url['github'] != repo.html_url

          if existing_service_with_same_url['file'].nil?
            puts existing_service_with_same_url.inspect
            next
          end

          File.open(existing_service_with_same_url['file'].to_s, 'w') do |f|

            json_to_write = JSON.parse(JSON.generate(existing_service_with_same_url))
            json_to_write.delete("file")
            json_to_write[:github] = repo.html_url
            f.write JSON.pretty_generate(json_to_write)
          end

        end

      else

        puts "NEW service?"
        puts repo.homepage
        puts repo.html_url
        puts "--"
      end
    end
  end
end
