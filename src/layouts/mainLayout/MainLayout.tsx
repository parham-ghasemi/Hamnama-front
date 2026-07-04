import { Outlet } from "react-router-dom";

import "./MainLayout.scss";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";

const DesktopLayout = () => {
  return (
    <div className="main-layout">
      <Header />

      <main className="main-layout__content">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default DesktopLayout;