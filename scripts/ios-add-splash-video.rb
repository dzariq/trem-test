#!/usr/bin/env ruby
# Adds resources/splash_screen.mp4 to the Capacitor iOS app target bundle.
require "xcodeproj"

project_path = File.expand_path("../ios/App/App.xcodeproj", __dir__)
video_src = File.expand_path("../resources/splash_screen.mp4", __dir__)
video_dest = File.expand_path("../ios/App/App/splash_screen.mp4", __dir__)

unless File.file?(video_src)
  warn "Missing #{video_src}"
  exit 1
end

FileUtils.cp(video_src, video_dest)

project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |t| t.name == "App" } || project.targets.first
group = project.main_group["App"] || project.main_group

file_ref = group.files.find { |f| f.path == "splash_screen.mp4" }
unless file_ref
  file_ref = group.new_file("splash_screen.mp4")
end

unless target.resources_build_phase.files_references.include?(file_ref)
  target.add_resources([file_ref])
end

project.save
puts "Added splash_screen.mp4 to #{target.name} resources"
