const VERSION = "0.2.1";

const dependencies = [
  ["统一覆写", "https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/stash-essentials.stoverride"],
  ["健康磁贴", "https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/scripts/essentials-health-tile.js?v=0.2.1"],
  ["B站界面脚本", "https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/scripts/bilibili-ui-clean.js?v=0.3.1"],
  ["轻量广告规则", "https://raw.githubusercontent.com/217heidai/adblockfilters/cc26e315e0b2082f6d51286bb8dbbc5bc25bb89a/rules/adblockmihomolite.yaml"],
  ["B站上游脚本", "https://github.com/BiliUniverse/ADBlock/releases/download/v0.6.24/response.bundle.js"],
];

function check(name, url) {
  return new Promise((resolve) => {
    $httpClient.get(
      {
        url,
        "auto-redirect": true,
        headers: {
          Range: "bytes=0-0",
          "Cache-Control": "no-cache",
        },
      },
      (error, response) => {
        const status = Number(response?.statusCode ?? response?.status ?? 0);
        resolve({ name, ok: !error && status >= 200 && status < 400, status });
      }
    );
  });
}

async function main() {
  const results = await Promise.all(dependencies.map(([name, url]) => check(name, url)));
  const failed = results.filter((result) => !result.ok);
  const lines = results.map((result) => `${result.ok ? "✅" : "❌"} ${result.name}${result.status ? ` (${result.status})` : ""}`);

  $done({
    title: `Essentials v${VERSION}`,
    content: `${lines.join("\n")}\n\n${failed.length ? `异常 ${failed.length} 项` : "全部依赖正常"}`,
    icon: failed.length ? "exclamationmark.triangle.fill" : "checkmark.shield.fill",
    backgroundColor: failed.length ? "#FF9500" : "#34C759",
  });
}

main().catch((error) => {
  console.log(`Essentials health check failed: ${error}`);
  $done({
    title: `Essentials v${VERSION}`,
    content: "❌ 健康检查脚本执行失败",
    icon: "exclamationmark.triangle.fill",
    backgroundColor: "#FF3B30",
  });
});
