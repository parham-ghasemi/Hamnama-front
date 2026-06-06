import { Outlet } from "react-router-dom";

import "./DesktopLayout.scss";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";

const DesktopLayout = () => {
  return (
    <div className="layout">
      <Header />

      <main className="layout__content">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default DesktopLayout;