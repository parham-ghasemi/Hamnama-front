import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Home from "../home/Home";

const getBackendCallbackURL = (status: string, authority: string) => {
  const configuredBase = String(import.meta.env.VITE_BASE_URL || "").replace(/\/+$/, "");
  const apiBase = configuredBase.endsWith("/api") ? configuredBase : `${configuredBase}/api`;
  const query = new URLSearchParams({ Status: status, Authority: authority });

  return `${apiBase}/payments/zarinpal/callback?${query.toString()}`;
};

const PaymentCallback = () => {
  const [params] = useSearchParams();
  const status = params.get("Status");
  const authority = params.get("Authority");

  useEffect(() => {
    if (!status || !authority) {
      return;
    }

    window.location.replace(getBackendCallbackURL(status, authority));
  }, [authority, status]);

  if (status && authority) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>در حال بررسی نتیجه پرداخت...</p>
      </main>
    );
  }

  return <Home />;
};

export default PaymentCallback;
