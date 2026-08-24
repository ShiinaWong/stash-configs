const VERSION = "0.4.0";

const dependencies = [
  ["统一覆写", "https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/stash-essentials.stoverride"],
  ["健康磁贴", "https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/scripts/essentials-health-tile.js?v=0.4.0"],
  ["B站界面脚本", "https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/scripts/bilibili-ui-clean.js?v=0.4.0"],
  ["轻量广告规则镜像", "https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/rules/adblockmihomolite.yaml"],
  ["B站响应脚本镜像", "https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/vendor/biliuniverse-adblock/response.bundle.js?v=0.6.24"],
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
