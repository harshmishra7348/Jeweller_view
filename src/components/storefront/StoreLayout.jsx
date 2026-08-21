import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { content } from "../../api/services";
import { DEFAULT_HOME_SETTINGS } from "../../config";

export default function StoreLayout() {
  const [homeSettings, setHomeSettings] = useState(DEFAULT_HOME_SETTINGS);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const settings = await content.homeSettings();
        if (alive) setHomeSettings({ ...DEFAULT_HOME_SETTINGS, ...(settings || {}) });
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--header-bg", homeSettings.headerBgColor || DEFAULT_HOME_SETTINGS.headerBgColor);
    root.style.setProperty("--header-primary", homeSettings.headerPrimaryFontColor || DEFAULT_HOME_SETTINGS.headerPrimaryFontColor);
    root.style.setProperty("--header-secondary", homeSettings.headerSecondaryFontColor || DEFAULT_HOME_SETTINGS.headerSecondaryFontColor);
    root.style.setProperty("--header-selected", homeSettings.headerSelectedItemColor || DEFAULT_HOME_SETTINGS.headerSelectedItemColor);
    root.style.setProperty("--header-hover", homeSettings.headerHoverItemColor || DEFAULT_HOME_SETTINGS.headerHoverItemColor);
    root.style.setProperty("--footer-bg", homeSettings.footerBgColor || DEFAULT_HOME_SETTINGS.footerBgColor);
    root.style.setProperty("--footer-primary", homeSettings.footerPrimaryFontColor || homeSettings.footerTextColor || DEFAULT_HOME_SETTINGS.footerPrimaryFontColor);
    root.style.setProperty("--footer-secondary", homeSettings.footerSecondaryFontColor || homeSettings.footerTextColor || DEFAULT_HOME_SETTINGS.footerSecondaryFontColor);
    root.style.setProperty("--footer-selected", homeSettings.footerSelectedItemColor || DEFAULT_HOME_SETTINGS.footerSelectedItemColor);
    root.style.setProperty("--footer-hover", homeSettings.footerHoverItemColor || DEFAULT_HOME_SETTINGS.footerHoverItemColor);
    root.style.setProperty("--page-bg", homeSettings.pageBgColor || DEFAULT_HOME_SETTINGS.pageBgColor);
  }, [homeSettings]);

  return (
    <>
      <Navbar settings={homeSettings} />
      <main className="site-body">
        <Outlet />
      </main>
      <Footer settings={homeSettings} />
    </>
  );
}
