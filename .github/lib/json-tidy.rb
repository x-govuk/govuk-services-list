#!/usr/bin/env ruby
require 'json'

Dir.glob("app/services/*.json") do |path|
  json = JSON.parse(File.read(path))
  File.write(path, JSON.pretty_generate(json))
end
