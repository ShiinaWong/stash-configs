require "yaml"

path = File.expand_path("../overrides/bilibili-adblock-lite.stoverride", __dir__)
config = YAML.safe_load(File.read(path), aliases: false)
version = config.fetch("version")
expected_provider = "📺 BiliBili.UI.Clean.v#{version}.response.json"

abort "description must show version" unless config.fetch("desc").include?("[v#{version}]")

provider = config.fetch("script-providers")[expected_provider]
abort "UI provider name must include version" unless provider
abort "UI provider URL must include version" unless provider.fetch("url").end_with?("?v=#{version}")

ui_rule = config.dig("http", "script").find { |rule| rule["match"].include?("feed\\/index") }
abort "feed UI rule missing" unless ui_rule
abort "feed UI rule must reference versioned provider" unless ui_rule["name"] == expected_provider

expected_mitm = ["api.live.bilibili.com", "api.vc.bilibili.com", "app.bilibili.com"]
abort "MitM hosts must stay minimal" unless config.dig("http", "mitm").sort == expected_mitm.sort

all_matches = config.dig("http", "script").map { |rule| rule.fetch("match") }.join("\n")
abort "gRPC endpoints must not be intercepted" if all_matches.match?(/grpc|polymer\\\.app\\\.search/i)
abort "web/API recommendation endpoint must not be intercepted" if all_matches.include?("web-interface")
abort "gRPC script provider must be absent" if config.fetch("script-providers").keys.any? { |name| name.include?("grpc") }

puts "stoverride: visible version and cache-busting provider verified"
