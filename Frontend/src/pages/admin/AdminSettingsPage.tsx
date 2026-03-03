export default function AdminSettingsPage() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-400">
          Configure platform features and operational limits for the InsightCode environment.
        </p>
      </header>

      {/* Feature toggles */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-100">Features</h2>
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl divide-y divide-slate-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">AI feedback</p>
              <p className="text-xs text-slate-400">
                Enable AI-generated feedback on user submissions.
              </p>
            </div>
            <input type="checkbox" className="toggle toggle-primary" defaultChecked />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">User registration</p>
              <p className="text-xs text-slate-400">
                Allow new developers to sign up without invitation.
              </p>
            </div>
            <input type="checkbox" className="toggle toggle-primary" defaultChecked />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">Maintenance mode</p>
              <p className="text-xs text-slate-400">
                Temporarily disable user access for planned maintenance windows.
              </p>
            </div>
            <input type="checkbox" className="toggle toggle-warning" />
          </div>
        </div>
      </section>

      {/* Rate limits */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-100">Rate limits</h2>
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-4">
          <div>
            <label className="label">
              <span className="label-text text-xs text-slate-300">
                Max submissions per minute (per user)
              </span>
            </label>
            <input
              type="number"
              defaultValue={30}
              className="input input-sm bg-slate-950 border-slate-700 w-32"
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text text-xs text-slate-300">
                Max AI feedback per hour (per user)
              </span>
            </label>
            <input
              type="number"
              defaultValue={60}
              className="input input-sm bg-slate-950 border-slate-700 w-32"
            />
          </div>
        </div>
      </section>

      {/* System info */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-100">System</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="card bg-slate-900/70 border border-slate-800">
            <div className="card-body py-3 px-4">
              <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-widest">
                Backend version
              </p>
              <p className="text-sm font-bold text-slate-100">v1.0.0</p>
            </div>
          </div>
          <div className="card bg-slate-900/70 border border-slate-800">
            <div className="card-body py-3 px-4">
              <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-widest">
                Frontend version
              </p>
              <p className="text-sm font-bold text-slate-100">v0.0.0</p>
            </div>
          </div>
          <div className="card bg-slate-900/70 border border-slate-800">
            <div className="card-body py-3 px-4">
              <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-widest">
                Database status
              </p>
              <p className="text-sm font-bold text-emerald-400">Healthy</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

