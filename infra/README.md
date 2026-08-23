# インフラストラクチャ（Bicep）

`func-tatsukoni-premium` および関連リソースを Bicep で管理する。

## 前提条件

- Azure CLI がインストール済みであること
- `az login` で認証済みであること
- リソースグループ `rg-tatsukoni-dev` が存在すること

## 管理対象リソース

| リソース | 名前 |
|----------|------|
| Storage Account | sttatsukonipremium |
| Application Insights | api-tatsukoni-premium |
| App Service Plan (ElasticPremium EP1) | plan-tatsukoni-premium |
| Function App (Linux, Node 24) | func-tatsukoni-premium |
| Deployment Slot | staging |
| Role Assignment (Website Contributor) | adsp-func-tatsukoni-feat → Function App |
| Role Assignment (Reader) | adsp-func-tatsukoni-feat → App Service Plan |
| Smart Detection Alert Rule | Failure Anomalies - api-tatsukoni-premium（自動生成） |

## 作成（デプロイ）

```bash
az deployment group create \
--resource-group rg-tatsukoni-dev \
--template-file infra/main.bicep \
--parameters infra/main.bicepparam
```

## 変更の確認（What-If）

実際にデプロイせず、変更内容を事前確認する。

```bash
az deployment group what-if \
--resource-group rg-tatsukoni-dev \
--template-file infra/main.bicep \
--parameters infra/main.bicepparam
```

## 削除

`rg-tatsukoni-dev` には他のリソースも存在するため、個別に削除する。

```bash
az resource delete --ids \
  /subscriptions/ba29533e-1e4c-43a8-898a-a5815e9b577b/resourceGroups/rg-tatsukoni-dev/providers/Microsoft.Web/sites/func-tatsukoni-premium \
  /subscriptions/ba29533e-1e4c-43a8-898a-a5815e9b577b/resourceGroups/rg-tatsukoni-dev/providers/Microsoft.Web/serverfarms/plan-tatsukoni-premium \
  /subscriptions/ba29533e-1e4c-43a8-898a-a5815e9b577b/resourceGroups/rg-tatsukoni-dev/providers/Microsoft.Storage/storageAccounts/sttatsukonipremium \
  /subscriptions/ba29533e-1e4c-43a8-898a-a5815e9b577b/resourceGroups/rg-tatsukoni-dev/providers/Microsoft.Insights/components/api-tatsukoni-premium \
  "/subscriptions/ba29533e-1e4c-43a8-898a-a5815e9b577b/resourceGroups/rg-tatsukoni-dev/providers/microsoft.alertsmanagement/smartDetectorAlertRules/Failure Anomalies - api-tatsukoni-premium"
```

> **注意:** Function App を先に削除してから App Service Plan を削除すること。上記コマンドは記載順に処理されるため、この順序で問題ない。
