import { getVoltaireSource } from "@/actions/voltaire";

export default async function SourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const source = await getVoltaireSource(id);
  return (
    <div className="max-w-3xl mx-auto p-8 my-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-serif mb-6 pb-4 border-b border-gray-200">
        {source?.section_name}
      </h1>
      <p className="text-lg leading-relaxed font-serif text-gray-800">
        {source?.paragraph}
      </p>
    </div>
  );
}
