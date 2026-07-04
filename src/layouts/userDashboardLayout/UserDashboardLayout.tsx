import { Outlet } from "react-router-dom";

import "./UserDashboardLayout.scss";
import Header from "../../components/header/Header";
import Sidebar from "./sidebar/Sidebar";

const UserDashboardLayout = () => {
  return (
    <div className="user-dashboard-layout">
      <Header />


      <main className="user-dashboard-layout__content">
        <div className="user-dashboard-layout__content__sidebar-container">
          <Sidebar />
        </div>
        <div className="user-dashboard-layout__content__page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default UserDashboardLayout;