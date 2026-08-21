import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { startLoading, stopLoading } from "../../loader/loaderService";

export default function PageLoader() {
  const location = useLocation();

  useEffect(() => {
    startLoading();
    const timer = window.setTimeout(stopLoading, 1000);
    return () => {
      window.clearTimeout(timer);
      stopLoading();
    };
  }, [location.pathname]);

  return null;
}
