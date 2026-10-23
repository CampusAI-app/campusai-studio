import React from "react";
import type { Theme } from "../theme";

/**
 * Device chrome drawn around the recording. Deliberately understated: the
 * product is the subject, the frame just gives it an edge to sit against.
 */
export const BrowserChrome: React.FC<{
  theme: Theme;
  fontFamily: string;
  url?: string;
  children: React.ReactNode;
}> = ({ theme, fontFamily, url, children }) => {
  const bar = 56;
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: theme.radius,
        overflow: "hidden",
        backgroundColor: theme.bgSoft,
        boxShadow: theme.shadow,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: bar,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 20px",
          backgroundColor: theme.bgSoft,
          borderBottom: `1px solid ${theme.ink}12`,
        }}
      >
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
          <div
            key={c}
            style={{
              width: 13,
              height: 13,
              borderRadius: 999,
              backgroundColor: c,
              opacity: 0.9,
            }}
          />
        ))}
        {url ? (
          <div
            style={{
              marginLeft: 18,
              flex: 1,
              maxWidth: 460,
              height: 32,
              borderRadius: 999,
              backgroundColor: `${theme.ink}0D`,
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              fontFamily,
              fontSize: 18,
              fontWeight: 500,
              color: theme.inkSoft,
              letterSpacing: "-0.01em",
            }}
          >
            {url}
          </div>
        ) : null}
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
};

export const PhoneChrome: React.FC<{
  theme: Theme;
  children: React.ReactNode;
}> = ({ theme, children }) => {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: 52,
        padding: 12,
        backgroundColor: "#111113",
        boxShadow: theme.shadow,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 42,
          overflow: "hidden",
          backgroundColor: theme.bgSoft,
        }}
      >
        {children}
        {/* dynamic island */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            width: 116,
            height: 32,
            borderRadius: 999,
            backgroundColor: "#111113",
          }}
        />
      </div>
    </div>
  );
};

export const BareChrome: React.FC<{
  theme: Theme;
  children: React.ReactNode;
}> = ({ theme, children }) => (
  <div
    style={{
      position: "relative",
      width: "100%",
      height: "100%",
      borderRadius: theme.radius,
      overflow: "hidden",
      boxShadow: theme.shadow,
      backgroundColor: theme.bgSoft,
    }}
  >
    {children}
  </div>
);
