"use client";

import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useLanguage } from "@/components/common/LanguageContext";

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "farmer";
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert(t("passwordsDoNotMatch"));
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log("Auth Success");

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name,
        email,
        role,
        createdAt: serverTimestamp(),
      });

      console.log("Firestore Success");
      alert(t("registrationSuccessful"));
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-10 w-full">
      <h1 className="text-3xl font-bold mb-2">
        {t("registerRoleTitle")} {t(role as any)}
      </h1>
      <p className="text-gray-500 mb-8">{t("registerSubtitle")}</p>

      <Input
        placeholder={t("fullNamePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4"
      />

      <Input
        placeholder={t("emailPlaceholder")}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4"
      />

      <Input
        placeholder={t("passwordPlaceholder")}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4"
      />

      <Input
        placeholder={t("confirmPasswordPlaceholder")}
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="mb-4"
      />

      <Button className="w-full" onClick={handleRegister}>
        {t("createAccount")}
      </Button>
    </div>
  );
}