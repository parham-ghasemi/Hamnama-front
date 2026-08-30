import type { ComponentType } from "react";
import "./access.scss";
import { useAdminAccess } from "../../components/adminRoute/AdminAccessContext";

const labels: Record<1 | 2 | 3, string> = {
  1: "تیکت‌ها، پشتیبانی و داشبورد",
  2: "تیکت‌ها، پشتیبانی، داشبورد، تنظیمات و کاربران",
  3: "دسترسی کامل مدیریت",
};

export default function AdminAccessGuard<P extends object>(Component: ComponentType<P>, minimumLevel: 1 | 2 | 3) {
  return function GuardedAdminPage(props: P) {
    const { accessLevel } = useAdminAccess();

    if (accessLevel < minimumLevel) {
      return (
        <section className="admin-access-guard">
          <div>
            <strong>دسترسی کافی ندارید</strong>
            <span>این بخش فقط برای {labels[minimumLevel]} در دسترس است.</span>
          </div>
        </section>
      );
    }
    return <Component {...props} />;
  };
}
