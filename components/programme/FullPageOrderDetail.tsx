"use client";

import React from "react";
import { Order } from "@/lib/types";
import FullPageVehicleDetail from "@/components/dealer/FullPageVehicleDetail";

export interface FullPageOrderDetailProps {
  orderId?: string;
  orderData?: Order;
  onBack?: () => void;
  backLabel?: string;
  onViewVehicle?: (vehicleId: string) => void;
}

export default function FullPageOrderDetail({
  orderId,
  orderData,
  onBack,
  backLabel = "Back to Orders",
  onViewVehicle,
}: FullPageOrderDetailProps) {
  return (
    <FullPageVehicleDetail
      vehicleId={orderData?.vehicle?.id || orderData?.vehicleId || "VEH_008"}
      vehicleData={orderData?.vehicle}
      orderId={orderId || orderData?.id}
      orderData={orderData}
      isProgramme={true}
      backLabel={backLabel}
      onBack={onBack}
    />
  );
}
