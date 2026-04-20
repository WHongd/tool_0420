import React from "react";
import { NavLink } from "react-router-dom";
const NAV_ITEMS = [
  {
    key: "dashboard",
    label: "工作台",
    to: "/dashboard",
    description: "快速开始创作内容",
  },
  {
    key: "generate",
    label: "内容生成",
    to: "/generate",
    description: "生成正文与平台版本",
  },
  {
    key: "personas",
    label: "人设库",
    to: "/personas",
    description: "管理写作人设模板",
  },
  {
    key: "history",
    label: "历史记录",
    to: "/published",
    description: "查看已生成内容",
  },
  {
    key: "favorites",
    label: "收藏夹",
    to: "/favorites",
    description: "收藏内容管理",
  },
];
function BrandBlock() {
  return (
    <div
      style={{
        padding: "20px 18px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#ffffff",
          marginBottom: 8,
          lineHeight: 1.2,
        }}
      >
        Article Creator
      </div>
      <div
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.7)",
          lineHeight: 1.7,
        }}
      >
        内容生成 + 多平台适配
      </div>
    </div>
  );
}

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      style={({ isActive }) => ({
        display: "block",
        textDecoration: "none",
        borderRadius: 16,
        padding: "14px 14px",
        background: isActive ? "#ffffff" : "transparent",
        color: isActive ? "#111827" : "rgba(255,255,255,0.92)",
        border: isActive
          ? "1px solid rgba(255,255,255,0.9)"
          : "1px solid transparent",
        transition: "all 0.2s ease",
      })}
    >
      {({ isActive }) => (
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              marginBottom: 6,
              lineHeight: 1.3,
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.6,
              color: isActive ? "#6b7280" : "rgba(255,255,255,0.68)",
            }}
          >
            {item.description}
          </div>
        </div>
      )}
    </NavLink>
  );
}

function QuickTips() {
  return (
    <div
      style={{
        marginTop: "auto",
        padding: 16,
        borderRadius: 18,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: "#ffffff",
          marginBottom: 8,
        }}
      >
        当前工作流
      </div>
      <div
        style={{
          fontSize: 12,
          lineHeight: 1.8,
          color: "rgba(255,255,255,0.72)",
        }}
      >
        1. 输入主题或正文草稿
        <br />
        2. 选择平台、目标、风格
        <br />
        3. 生成标题方案
        <br />
        4. 查看评分与改写结果
        <br />
        5. 一键回填标题
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 280,
        minWidth: 280,
        height: "100vh",
        background: "#111827",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <BrandBlock />

      <nav
        style={{
          display: "grid",
          gap: 10,
          marginTop: 16,
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.key} item={item} />
        ))}
      </nav>

      <QuickTips />
    </aside>
  );
}