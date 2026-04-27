export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-white">
          Sistema de Inteligencia Multifuente
        </h1>
        <p className="mt-2 text-gray-400">
          Conflicto Irán – Israel – EE.UU. · ML1 2026I · Universidad Externado de Colombia
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard label="Fuentes integradas" value="5" sub="ACLED · GDELT · RSS · OpenSky · Bluesky" />
        <StatCard label="Modelos comparados" value="4" sub="KNN · Naive Bayes · LogReg · Ridge" />
        <StatCard label="Unidad de análisis" value="País-Día" sub="Nivel de escalada como target" />
      </div>

      <section className="bg-gray-900 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">Pregunta analítica</h2>
        <p className="text-gray-300 leading-relaxed">
          ¿Es posible clasificar el nivel de escalada del conflicto Irán-Israel-EE.UU. en ventanas
          país-día usando exclusivamente fuentes abiertas y gratuitas (eventos estructurados,
          noticias, movilidad aérea y señales sociales)?
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Fuentes de datos</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <SourceRow type="Estructurada" name="ACLED" desc="Eventos de conflicto, fatalidades, actores" />
            <SourceRow type="Textual" name="GDELT" desc="Noticias, tono, menciones geográficas" />
            <SourceRow type="Textual" name="RSS (BBC · AJ · GNews)" desc="Titulares y corpus noticioso" />
            <SourceRow type="Movilidad" name="OpenSky" desc="Vuelos en el espacio aéreo de Medio Oriente" />
            <SourceRow type="Social" name="Bluesky" desc="Posts públicos sobre el conflicto" />
          </ul>
        </section>

        <section className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Resultados del modelo</h2>
          <p className="text-gray-500 text-sm italic">
            Los resultados se cargarán una vez que el pipeline de datos y entrenamiento haya corrido.
          </p>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-4xl font-bold text-white mt-1">{value}</p>
      <p className="text-gray-500 text-xs mt-1">{sub}</p>
    </div>
  );
}

function SourceRow({ type, name, desc }: { type: string; name: string; desc: string }) {
  const colors: Record<string, string> = {
    Estructurada: "bg-blue-900 text-blue-300",
    Textual: "bg-green-900 text-green-300",
    Movilidad: "bg-yellow-900 text-yellow-300",
    Social: "bg-purple-900 text-purple-300",
  };
  return (
    <li className="flex items-start gap-3">
      <span
        className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${colors[type] ?? "bg-gray-700 text-gray-300"}`}
      >
        {type}
      </span>
      <span>
        <span className="font-medium text-white">{name}</span>
        <span className="text-gray-400"> — {desc}</span>
      </span>
    </li>
  );
}
