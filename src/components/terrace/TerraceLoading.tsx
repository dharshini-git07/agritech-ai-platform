import { useLanguage } from "@/components/common/LanguageContext";

export default function TerraceLoading() {
  const { t } = useLanguage();

  return (
    <div className="rounded-3xl bg-white shadow-lg p-10 text-center">
      <h2 className="text-2xl font-bold">{t("analyzingTerraceProgress")}</h2>

      <p className="text-gray-500 mt-4">{t("analyzingTerraceDesc")}</p>
    </div>
  );
}