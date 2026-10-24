import { Suspense } from "react";
import type { Metadata } from "next";
import { StaffBookings } from "@/modules/cafe/staff";
export const metadata: Metadata = {
  title: "پذیرش کافه",
  robots: { index: false, follow: false },
};
export default function StaffPage() {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-8 text-center">
          در حال آماده‌سازی پذیرش…
        </p>
      }
    >
      <StaffBookings />
    </Suspense>
  );
}
