require "yaml"

root = File.expand_path("..", __dir__)
essentials = YAML.safe_load(
  File.read(File.join(root, "overrides/stash-essentials.stoverride")),
  aliases: false
)
bilibili = YAML.safe_load(
  File.read(File.join(root, "overrides/bilibili-adblock-lite.stoverride")),
  aliases: false
)

abort "unexpected essentials version" unless essentials.fetch("version") == "0.2.1"
abort "description must show version" unless essentials.fetch("desc").include?("[v0.2.1]")

provider = essentials.dig("rule-providers", "🛡️ AdBlock.DNS.Lite")
abort "lite ad provider missing" unless provider
abort "ad provider must be a domain set" unless provider.fetch("behavior") == "domain"
abort "ad provider must use YAML" unless provider.fetch("format") == "yaml"
abort "ad provider must be pinned" unless provider.fetch("url").include?("/cc26e315e0b2082f6d51286bb8dbbc5bc25bb89a/")
abort "ad rules must reject the lite provider" unless essentials.fetch("rules") == ["RULE-SET,🛡️ AdBlock.DNS.Lite,REJECT"]

abort "embedded BiliBili HTTP config drifted" unless essentials.fetch("http") == bilibili.fetch("http")
expected_tiles = ["🩺 Essentials.Health.v0.2.1"]
abort "unexpected tile set" unless essentials.fetch("tiles").map { |tile| tile.fetch("name") } == expected_tiles

providers = essentials.fetch("script-providers")
abort "health tile URL must include version" unless providers.fetch("🩺 Essentials.Health.v0.2.1").fetch("url").end_with?("?v=0.2.1")

bilibili.fetch("script-providers").each do |name, provider_config|
  abort "embedded BiliBili provider drifted: #{name}" unless providers[name] == provider_config
end

abort "tiles must not widen MITM" unless essentials.dig("http", "mitm") == bilibili.dig("http", "mitm")

puts "essentials: pinned ad rules, health tile, and embedded BiliBili config verified"
