#!/bin/bash
#
# 使い方:
#   ./request.sh {test|feat|sample}
#
# 引数:
#   test   - https://.../api/test/testHttpTrigger   に 1回/秒 アクセス
#   feat   - https://.../api/feat/featHttpTrigger   に 1回/秒 アクセス
#   sample - https://.../api/sample/response        に 1回/秒 アクセス
#
# 停止: Ctrl+C

case "$1" in
  test)
    URL="https://tatsukoni-demo-cve4defegecxg2e5.z01.azurefd.net/api/test/testHttpTrigger"
    ;;
  feat)
    URL="https://tatsukoni-demo-cve4defegecxg2e5.z01.azurefd.net/api/feat/featHttpTrigger"
    ;;
  sample)
    URL="https://tatsukoni-demo-cve4defegecxg2e5.z01.azurefd.net/api/sample/response"
    ;;
  *)
    echo "Usage: $0 {test|feat|sample}"
    exit 1
    ;;
esac

echo "Sending requests to: $URL"
echo "Press Ctrl+C to stop."

while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
  echo "$(date '+%Y-%m-%d %H:%M:%S') $STATUS"
  sleep 1
done
