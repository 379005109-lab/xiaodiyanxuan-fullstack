# 🔧 添加 KUBECONFIG Secret 到 GitHub

## ❌ 当前错误

```
The connection to the server localhost:8080 was refused
```

**原因**：GitHub Actions 缺少 `KUBECONFIG` secret，无法连接到你的 Kubernetes 集群。

---

## ✅ 解决步骤（1分钟）

### 第1步：复制 KUBECONFIG 内容

我已经为你准备好了 base64 编码的 kubeconfig，在文件：
```
/home/devbox/project/KUBECONFIG_BASE64.txt
```

**在终端执行（复制输出）：**
```bash
cat /home/devbox/project/KUBECONFIG_BASE64.txt
```

或者直接复制这个（整个内容）：

```
YXBpVmVyc2lvbjogdjEKY2x1c3RlcnM6Ci0gY2x1c3RlcjoKICAgIGNlcnRpZmljYXRlLWF1dGhvcml0eS1kYXRhOiBMUzB0TFMxQ1JVZEpUaUJEUlZKVVNVWkpRMEZVUlMwdExTMHRDazFKU1VNMlZFTkRRV1JIWjBGM1NVSkJaMGxDUVVSQlRrSm5hM0ZvYTJsSE9YY3dRa0ZSYzBaQlJFRldUVkpOZDBWUldVUldVVkZFUlhkd2NtUlhTbXdLWTIwMWJHUkhWbnBOUTBGWVJGUkpNRTFFUlhsT1ZFVXhUa1JqZWsxR2IxbEVla2w0VFdwUmQwMVVRWGhOVkZVd1RucE5kMWRxUVZaTlVrMTNSVkZaUkFwV1VWRkVSWGR3Y21SWFNteGpiVFZzWkVkV2VrMUpTVUpKYWtGT1FtZHJjV2hyYVVjNWR6QkNRVkZGUmtGQlQwTkJVVGhCVFVsSlFrTm5TME5CVVVWQkNqRlZVWGxaZFVwMFozSmxVbWhCT1N0RmFHTlNRVVJHWm1GelJDdFZaVWxqTTBaU1ZHMUhhMDVRWVhacGNsa3dWMnROVTJaMlR6VlhiMm8yYUZST1MwWUtZazVtVFdkMk9XZFFlamN5ZWxSS1VWaEhhVk5rV21WYVNsTjZkblJPUVVaVE5uZzFRV0Z4UkdKd2VUWTNVbE5qTTAwMVVtcHZjM0kwTVU1dlpGUmFRZ3BWUlZrNFdIQjZkbEU0Y1ZocU1sbDRWalo0WTFONWRtRmpVVXNyTUVVd1RWbGpRVlptVld4UVZrOUxUVE5hWkdkU1NqWXJSVTB2YmxKcGVGQnlTemxHQ25SYWFIaHlhbWxyVW1RclYySlpVSEpPY0V4c2VUQklVRlpSYlhaT05XZHlPRTlEYVcxWU5WazRTV2RLUXk4NGNqa3JSMEZhTVdkeE1DdDBWMUZwTHprS1dtYzJXVUY2YlV4Sk1pOUpSeTh4ZVc1dFRsSm9VWEU1TVZoNE1URnpla2MwYkRKcVVUaFVNWGhyU1dONmNUWTNjeXRTT1RsM1JTdDZjMFZsTmxKWFF3cEdTVFkwU0hGcmVqVTNNMUJaTmxWeVpHUmlRbUpSU1VSQlVVRkNiekJKZDFGRVFVOUNaMDVXU0ZFNFFrRm1PRVZDUVUxRFFYRlJkMFIzV1VSV1VqQlVDa0ZSU0M5Q1FWVjNRWGRGUWk5NlFXUkNaMDVXU0ZFMFJVWm5VVlZZTDJKd1kwbDFSbEJDZWxac1dHMVVWME5KWjFjNU5VNVZiVzkzUkZGWlNrdHZXa2tLYUhaalRrRlJSVXhDVVVGRVoyZEZRa0ZFU0d4WE4xQk5ibGRYTkVrMWJ6Sk1PVUV6ZFhSRVZXbzFZVGhqVHpoaUswcGhObUpxZVRVd1F6bEZRazFoVVFwUlRqSkhRVWRKSzFSSGRqTlNWV3R3UlV4dFRtMXNSVGsxUnpCd05YZE1hRTVhUkRCcWFub3ZWbHB3UVd0TUsyRnNZamxqYzA5eVFsWmxRWGcyY1ZOWENsZGpjMnN2TkdOa1ZIZEhhMlphTTAxUWJEUmpSMEZzY0RGS1FrbHdhRVl4ZUdNdlNDdFpZa1U0VTI1UmNETnJja2d5VHpWbVkycHFUMWhHYVd4Q1lVVUtaSGxCU1ZSbFZpOTBja1poUW5WdmFVRnpiRGRqTTI1aE5HOXJiRU5uUzNocmNqWkpibVZsY1RsVFVHaGpiMEZXWTA5cGRYTTViR0p6U1ZCU05VWkZVZ295UzBsbFltbGxWM05KVlVsWVZFNVdSREpoV1VWM1dWVlRSVlJZWlU5TVVYRkVUbWxFTUdnNFVrbHRZV2RoTjJKbU1Wb3JZemt6VWxOUlYwTXJPWEZoQ201eWMyaGFUMUZKWjFaT2EwTkNiRFJDVjJ4UWNEQTVPWGh2UTFoNlRFdHFVM1JZWWxOTGN6MEtMUzB0TFMxRlRrUWdRMFZTVkVsR1NVTkJWRVV0TFMwdExRbz0KICAgIHNlcnZlcjogaHR0cHM6Ly9oemguc2VhbG9zLnJ1bjo2NDQzCiAgbmFtZTogc2VhbG9zCmNvbnRleHRzOgotIGNvbnRleHQ6CiAgICBjbHVzdGVyOiBzZWFsb3MKICAgIG5hbWVzcGFjZTogbnMtY3h4aXd4Y2UKICAgIHVzZXI6IGN4eGl3eGNlCiAgbmFtZTogY3h4aXd4Y2VAc2VhbG9zCmN1cnJlbnQtY29udGV4dDogY3h4aXd4Y2VAc2VhbG9zCmtpbmQ6IENvbmZpZwpwcmVmZXJlbmNlczoge30KdXNlcnM6Ci0gbmFtZTogY3h4aXd4Y2UKICB1c2VyOgogICAgdG9rZW46IGV5SmhiR2NpT2lKU1V6STFOaUlzSW10cFpDSTZJbmxHYzBnM2EySkNORm8yUjFCcGN6UkRSbEExWWtoa2IyVk5TbFZJTVUxUFoxa3RZVXB5VkRKcmQyOGlmUS5leUpwYzNNaU9pSnJkV0psY201bGRHVnpMM05sY25acFkyVmhZMk52ZFc1MElpd2lhM1ZpWlhKdVpYUmxjeTVwYnk5elpYSjJhV05sWVdOamIzVnVkQzl1WVcxbGMzQmhZMlVpT2lKMWMyVnlMWE41YzNSbGJTSXNJbXQxWW1WeWJtVjBaWE11YVc4dmMyVnlkbWxqWldGalkyOTFiblF2YzJWamNtVjBMbTVoYldVaU9pSnpaV0ZzYjNNdGRHOXJaVzR0WTNoNGFYZDRZMlV0WldWallpSXNJbXQxWW1WeWJtVjBaWE11YVc4dmMyVnlkbWxqWldGalkyOTFiblF2YzJWeWRtbGpaUzFoWTJOdmRXNTBMbTVoYldVaU9pSmplSGhwZDNoalpTSXNJbXQxWW1WeWJtVjBaWE11YVc4dmMyVnlkbWxqWldGalkyOTFiblF2YzJWeWRtbGpaUzFoWTJOdmRXNTBMblZwWkNJNklqQTFZekl6TnpnM0xUTmtOemd0TkRVMFpTMDVPVGhpTFdWaU5UVTBaalE0Wmpoak15SXNJbk4xWWlJNkluTjVjM1JsYlRwelpYSjJhV05sWVdOamIzVnVkRHAxYzJWeUxYTjVjM1JsYlRwamVIaHBkM2hqWlNKOS5FNWtNYVhobFQ1TVVtaGpzLU02THUtdUxlUUlqeEl5cF9BdmV3RnRYOW1wdnAweWVJZ2NDRG9BZ3llRWxfbTZTSHVGS2M4OGtTR1d0cFd0ak51Z0tFOVF6N20zTUVjekZ2dzNNWFk5R2RhTi13NEpmc3BFR0QyOEE0bkh2enVORVZQR05pNEVRUGpyVHVmSEdndzhzRkcwV0hWc2NOZHRBVlBCbzNNRWdyd29VNHZDMndseFpfOUNNa3FXQUdvVG5VY0FORGVlWWlucjl1WFpPd29wM1ZGSXFucUJGdGtMaTFYdW1LS28zSWdiTS1vbTlNS0wwNm5sVXA4UFcwanNhU2M0OEwzdGc0QzkwWms5bm92UllGeDBOa01xTG0xRHJ4a3RReDNVQUtuRmtFazBVbThMN0xuTGtsTFFoTmt
```

---

### 第2步：添加到 GitHub Secrets

1. **打开这个链接**：
   ```
   https://github.com/379005109-lab/xiaodiyanxuan-fullstack/settings/secrets/actions
   ```

2. **点击** `New repository secret` 按钮（绿色按钮）

3. **填写**：
   - **Name**: `KUBECONFIG` （必须完全一致）
   - **Secret**: 粘贴刚才复制的整个 base64 内容
   
4. **点击** `Add secret` 按钮

---

### 第3步：重新运行构建

1. **打开 Actions 页面**：
   ```
   https://github.com/379005109-lab/xiaodiyanxuan-fullstack/actions
   ```

2. **点击**最新的失败的工作流

3. **点击**右上角 `Re-run all jobs` 按钮

---

## ✅ 验证成功

重新运行后，你应该会看到：

1. ✅ "Configure Kubernetes" 步骤通过（之前失败）
2. ✅ "Update Kubernetes deployment" 开始执行
3. ✅ "Verify deployment" 显示 Pod 状态

---

## 📋 当前需要的所有 Secrets

确保你的仓库有这些 Secrets：

| Secret Name | 状态 | 用途 |
|------------|------|------|
| `REGISTRY_USERNAME` | ⏳ 待检查 | 推送 Docker 镜像到 Registry |
| `REGISTRY_PASSWORD` | ⏳ 待检查 | 推送 Docker 镜像到 Registry |
| `KUBECONFIG` | ⏳ 待添加 | 连接 Kubernetes 集群 |

---

## 🎯 下一步

添加好 `KUBECONFIG` secret 后：

1. 重新运行 GitHub Actions
2. 等待 8-10 分钟构建完成
3. 测试三个接口

---

## 💡 提示

- `KUBECONFIG` secret 是 **base64 编码** 的
- 必须包含**完整内容**（从 `YXBp` 开始到 `TGt` 结尾）
- Secret 名称必须是 `KUBECONFIG`（全大写）

---

**现在去添加 KUBECONFIG secret 吧！** 🚀

👉 https://github.com/379005109-lab/xiaodiyanxuan-fullstack/settings/secrets/actions
