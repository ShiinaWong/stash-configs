/* Conservative Tieba splash cleaner for Stash. */

try {
  const payload = JSON.parse($response.body);
  if (payload && payload.error_code === 0) {
    payload.error_code = 2230209;
    payload.data = null;
    $done({ body: JSON.stringify(payload) });
  } else {
    $done({});
  }
} catch (error) {
  console.log(`Tieba Splash Clean: ${error}`);
  $done({});
}
