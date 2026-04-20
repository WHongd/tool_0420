export default function EmptyStateCard({ title, description }) {
  return (
    <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </section>
  );
}