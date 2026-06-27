export default function HeroStats() {
  const stats = [
    {
      number: "1000+",
      title: "Farmers",
    },
    {
      number: "95%",
      title: "Water Saved",
    },
    {
      number: "24/7",
      title: "AI Monitoring",
    },
  ];

  return (
    <div className="flex gap-12 mt-10">
      {stats.map((stat) => (
        <div key={stat.title}>
          <h2 className="text-3xl font-bold text-green-600">
            {stat.number}
          </h2>

          <p className="text-gray-500">
            {stat.title}
          </p>
        </div>
      ))}
    </div>
  );
}