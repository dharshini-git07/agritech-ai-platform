import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { becomeSeller, updateSellerProfile, getSellerProfile } from "@/services/marketplaceService";
import { useLanguage } from "@/components/common/LanguageContext";
import { SELLER_TYPES, SellerTypeName } from "@/lib/marketplaceConstants";
import { auth } from "@/lib/firebase";
import { AlertCircle, CheckCircle, Store } from "lucide-react";

interface SellerFormProps {
  onSuccess?: () => void;
}

export default function SellerForm({ onSuccess }: SellerFormProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [sellerType, setSellerType] = useState<SellerTypeName>("Farmer");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const profile = await getSellerProfile(user.uid);
        if (profile) {
          setIsEdit(true);
          setStatus(profile.verificationStatus);
          setBusinessName(profile.businessName);
          setSellerType(profile.sellerType);
          setContactNumber(profile.contactNumber);
          setAddress(profile.address);
          setDescription(profile.description);
        }
      } catch (err) {
        console.error("Error loading seller profile:", err);
      } finally {
        setChecking(false);
      }
    }
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !contactNumber || !address || !description) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await updateSellerProfile({
          businessName,
          sellerType,
          contactNumber,
          address,
          description,
        });
        alert("Seller Profile updated successfully!");
      } else {
        await becomeSeller({
          businessName,
          sellerType,
          contactNumber,
          address,
          description,
        });
        alert("Seller registration submitted! Your profile is pending admin approval.");
        setIsEdit(true);
        setStatus("pending");
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="text-center py-10 text-gray-500">Checking seller profile status...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-green-150 rounded-2xl text-green-700">
          <Store size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isEdit ? t("editProduct") + " " + t("sellerProfile") : t("becomeSeller")}
          </h2>
          <p className="text-sm text-gray-500">
            {isEdit 
              ? "Update your retail business details." 
              : "Become a verified seller and sell products to local terrace farming enthusiasts."}
          </p>
        </div>
      </div>

      {isEdit && status && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border ${
          status === "approved" 
            ? "bg-green-50 border-green-200 text-green-800"
            : status === "rejected"
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}>
          {status === "approved" ? (
            <CheckCircle className="shrink-0" size={20} />
          ) : (
            <AlertCircle className="shrink-0" size={20} />
          )}
          <div className="text-sm">
            <span className="font-semibold">{t("verificationStatus")}: </span>
            <span className="capitalize font-bold">{status === "approved" ? t("approved") : status === "rejected" ? t("rejected") : t("pendingApproval")}</span>
            <p className="text-xs mt-1 opacity-90">
              {status === "approved" && "Your shop is open! You can add products and sell to customers."}
              {status === "pending" && "Your shop profile is being reviewed by our administration team."}
              {status === "rejected" && "Your shop profile was rejected. Please contact support or correct your details."}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t("businessName")}
          </label>
          <Input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Green Terrace Nursery"
            required
            className="rounded-xl border-gray-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t("sellerType")}
          </label>
          <select
            value={sellerType}
            onChange={(e) => setSellerType(e.target.value as SellerTypeName)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
          >
            {SELLER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t("contactNumber")}
          </label>
          <Input
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder="e.g. +91 98765 43210"
            required
            className="rounded-xl border-gray-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t("address")}
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Complete physical address of your business"
            required
            rows={3}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Map location picker removed */}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t("description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your nursery, farm, products, organic standards, and vision..."
            required
            rows={4}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <Button
          type="submit"
          className="w-full py-3 rounded-xl font-bold bg-green-700 hover:bg-green-800 text-white transition duration-200"
          disabled={loading}
        >
          {loading ? "Saving..." : isEdit ? "Update Profile" : "Register Business"}
        </Button>
      </form>
    </div>
  );
}
