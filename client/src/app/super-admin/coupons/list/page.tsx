"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCouponStore } from "@/store/useCouponStore";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function SuperAdminCouponsListingPage() {
  const { isLoading, couponList, fetchCoupons, deleteCoupon, toggleCouponStatus } =
    useCouponStore();
  const router = useRouter();
  const fetchCouponRef = useRef(false);
  const { toast } = useToast();
  useEffect(() => {
    if (!fetchCouponRef.current) {
      fetchCoupons();
      fetchCouponRef.current = true;
    }
  }, [fetchCoupons]);

  const handleDeleteCoupon = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      const result = await deleteCoupon(id);
      if (result) {
        toast({
          title: "Coupon deleted successfully",
          variant: "success",
        });
        fetchCoupons();
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: "active" | "inactive") => {
    const shouldBeActive = newStatus === "active";
    const result = await toggleCouponStatus(id, shouldBeActive);
    if (result) {
      toast({
        title: result.isActive ? "Coupon activated successfully" : "Coupon deactivated successfully",
        variant: "success",
      });
    } else {
      toast({
        title: "Failed to update coupon status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">All Coupons</h1>
          <Button 
            onClick={() => router.push("/super-admin/coupons/add")}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Add New Coupon
          </Button>
        </header>
        <div className="bg-white rounded-lg shadow-lg p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {couponList.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell>
                  <p className="font-semibold">{coupon.code}</p>
                </TableCell>
                <TableCell>
                  <p>{coupon.discountPercent}%</p>
                </TableCell>
                <TableCell>
                  <p>
                    {coupon.usageCount}/{coupon.usageLimit}
                  </p>
                </TableCell>
                <TableCell>
                  {format(new Date(coupon.startDate), "dd MMM yyyy")}
                </TableCell>
                <TableCell>
                  {format(new Date(coupon.endDate), "dd MMM yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Select
                      value={coupon.isActive ? "active" : "inactive"}
                      onValueChange={(value) =>
                        handleStatusChange(coupon.id, value as "active" | "inactive")
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    {new Date(coupon.endDate) < new Date() && (
                      <Badge variant="outline" className="text-xs">
                        Expired
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleDeleteCoupon(coupon.id)}
                    variant="ghost"
                    size={"sm"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminCouponsListingPage;
