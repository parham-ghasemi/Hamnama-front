import { useState } from "react";
import { Outlet } from "react-router-dom";
import clsx from "clsx"; // Make sure to install/import clsx
import "./UserDashboardLayout.scss";
import Header from "../../components/header/Header";
import Sidebar from "./sidebar/Sidebar";

const UserDashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="user-dashboard-layout" dir="rtl">
      {/* Pass the toggle function to Header */}
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

      <main className="user-dashboard-layout__content">
        <div className="user-dashboard-layout__content__glow" aria-hidden="true" />

        {/* Mobile Backdrop Overlay */}
        <div
          className={clsx(
            "user-dashboard-layout__content__backdrop",
            isSidebarOpen && "is-open"
          )}
          onClick={() => setIsSidebarOpen(false)}
        />

        <div className={clsx(
          "user-dashboard-layout__content__sidebar-container",
          isSidebarOpen && "is-open"
        )}>
          {/* Pass close function to Sidebar */}
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>

        <div className="user-dashboard-layout__content__page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default UserDashboardLayout;
