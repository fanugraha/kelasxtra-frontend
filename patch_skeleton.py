import sys

path = sys.argv[1] if len(sys.argv) > 1 else "src/pages/app/Packages.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = '''      {/* Grid paket */}
      <div className="flex flex-wrap gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 h-56" />
        ))}
      </div>'''

new = '''      {/* Grid paket */}
      <div className="flex flex-wrap gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-4 w-full sm:w-72 shrink-0"
          >
            <div className="h-32 w-full bg-slate-200 rounded-lg mb-4" />
            <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
            <div className="h-4 w-1/2 bg-slate-200 rounded mb-4" />
            <div className="h-3 w-full bg-slate-200 rounded mb-1.5" />
            <div className="h-3 w-2/3 bg-slate-200 rounded mb-4" />
            <div className="h-9 w-full bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>'''

if old not in content:
    print("PATTERN NOT FOUND — file mungkin sudah berubah, cek manual.")
    sys.exit(1)

content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Berhasil patch:", path)
