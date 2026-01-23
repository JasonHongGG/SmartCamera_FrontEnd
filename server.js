const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const app = express();
const apiTarget = process.env.API_PROXY_TARGET || "http://host.docker.internal:5000";

// API Proxy 要放在最前面
app.use("/api", createProxyMiddleware({
  target: apiTarget,
  changeOrigin: true,
  pathRewrite: {
    "^/api": "" // 移除 /api 前綴，直接轉發到 Flask
  }
}));

// 提供 React 靜態檔案
app.use(express.static(path.join(__dirname, "build")));

// React router fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
