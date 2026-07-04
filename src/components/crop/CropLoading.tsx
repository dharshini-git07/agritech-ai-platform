import { useLanguage } from "@/components/common/LanguageContext";

export default function CropLoading() {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
      <h2 className="text-2xl font-bold">{t("analyzingCropText")}</h2>

      <p className="text-gray-500 mt-4">{t("analyzingCropDesc")}</p>
    </div>
  );
}