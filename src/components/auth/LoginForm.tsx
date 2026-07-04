"use client";

import { sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/common/LanguageContext";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRole = searchParams.get("role") || "farmer";
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      // Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Read user document from Firestore
      const userDoc = await getDoc(
        doc(db, "users", userCredential.user.uid)
      );

      if (!userDoc.exists()) {
        alert(t("userProfileNotFound"));
        return;
      }

      const userData = userDoc.data();

      // Role verification
      if (userData.role !== selectedRole) {
        alert(
          `${t("wrongRoleSelected")} ${t(userData.role as any)}.`
        );
        return;
      }

      // Redirect
      switch (userData.role) {
        case "farmer":
          router.push("/dashboard");
          break;

        case "customer":
          router.push("/customer");
          break;

        case "admin":
          router.push("/admin");
          break;

        default:
          router.push("/");
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert(t("enterEmailFirst"));
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert(t("passwordResetSent"));
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-10 w-full">
      <h1 className="text-3xl font-bold mb-2">
        {t("welcomeRole")} {t(selectedRole as any)}
      </h1>

      <p className="text-gray-500 mb-8">{t("loginSubtitle")}</p>

      <Input
        type="email"
        placeholder={t("emailPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4"
      />
      <Input
        type="password"
        placeholder={t("passwordPlaceholder")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-6"
      />

      <button
        onClick={handleForgotPassword}
        className="text-sm text-green-650 hover:underline cursor-pointer mb-6 block text-left"
      >
        {t("forgotPassword")}
      </button>

      <Button className="w-full" onClick={handleLogin}>
        {t("login")}
      </Button>

      <p className="text-center mt-6 text-sm">
        {t("dontHaveAccount")}{" "}
        <Link
          href={`/register?role=${selectedRole}`}
          className="text-green-600 font-semibold"
        >
          {t("createAccount")}
        </Link>
      </p>
    </div>
  );
}