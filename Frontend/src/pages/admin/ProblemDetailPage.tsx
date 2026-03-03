export default function ProblemDetailPage() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">Edit problem</h1>
          <p className="text-sm text-slate-400">
            Update problem text, difficulty and testcases for this coding challenge.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-sm md:btn-md btn-ghost border border-slate-700">
            Discard
          </button>
          <button className="btn btn-sm md:btn-md btn-primary gap-1">
            <span className="material-symbols-outlined text-sm">save</span>
            Save
          </button>
        </div>
      </header>

      {/* Main editor grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: metadata + description */}
        <section className="lg:col-span-2 space-y-4">
          <div className="card bg-slate-900/70 border border-slate-800">
            <div className="card-body space-y-3">
              <div>
                <label className="label">
                  <span className="label-text text-xs font-semibold text-slate-300">
                    Title
                  </span>
                </label>
                <input
                  className="input input-sm md:input-md input-bordered w-full bg-slate-950 border-slate-700"
                  defaultValue="Longest Palindromic Substring"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="label">
                    <span className="label-text text-xs font-semibold text-slate-300">
                      Difficulty
                    </span>
                  </label>
                  <select className="select select-sm w-full bg-slate-950 border-slate-700">
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="label">
                    <span className="label-text text-xs font-semibold text-slate-300">
                      Tags
                    </span>
                  </label>
                  <input
                    className="input input-sm w-full bg-slate-950 border-slate-700"
                    placeholder="e.g. string, dp"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-slate-900/70 border border-slate-800">
            <div className="card-body space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="card-title text-base">Description</h2>
                <span className="badge badge-outline badge-sm">Markdown</span>
              </div>
              <textarea
                className="textarea textarea-bordered bg-slate-950 border-slate-700 text-sm leading-relaxed min-h-[220px]"
                defaultValue={
                  'Given a string s, return the longest palindromic substring in s.\n\nA string is palindromic if it reads the same backward as forward.'
                }
              />
            </div>
          </div>
        </section>

        {/* Right: settings */}
        <aside className="space-y-4">
          <div className="card bg-slate-900/70 border border-slate-800">
            <div className="card-body space-y-3">
              <h2 className="card-title text-base">Visibility</h2>
              <div className="form-control">
                <label className="label cursor-pointer justify-between">
                  <span className="label-text text-xs text-slate-300">Active</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </label>
              </div>
              <p className="text-[11px] text-slate-500">
                Inactive problems will not be listed in the user problem explorer.
              </p>
            </div>
          </div>

          <div className="card bg-slate-900/70 border border-slate-800">
            <div className="card-body space-y-3">
              <h2 className="card-title text-base">Constraints</h2>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Time limit</span>
                  <input
                    className="input input-xs w-20 bg-slate-950 border-slate-700 text-right"
                    defaultValue="1"
                  />
                  <span className="text-slate-500">seconds</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Memory</span>
                  <input
                    className="input input-xs w-20 bg-slate-950 border-slate-700 text-right"
                    defaultValue="256"
                  />
                  <span className="text-slate-500">MB</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Testcases editor */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">Testcases</h2>
          <button className="btn btn-xs btn-outline border-slate-700 text-slate-200">
            <span className="material-symbols-outlined text-xs mr-1">add</span>
            Add testcase
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((id) => (
            <div key={id} className="card bg-slate-900/70 border border-slate-800">
              <div className="card-body space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">Case #{id}</span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <label className="label cursor-pointer gap-1">
                      <span>Hidden</span>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        defaultChecked={id === 2}
                      />
                    </label>
                    <button className="btn btn-ghost btn-xs text-slate-400">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
                <label className="label">
                  <span className="label-text text-[11px] text-slate-400">Input</span>
                </label>
                <textarea
                  className="textarea textarea-xs bg-slate-950 border-slate-700 text-xs font-mono"
                  defaultValue={id === 1 ? '"babad"' : '"cbbd"'}
                />
                <label className="label">
                  <span className="label-text text-[11px] text-slate-400">Expected</span>
                </label>
                <textarea
                  className="textarea textarea-xs bg-slate-950 border-slate-700 text-xs font-mono"
                  defaultValue={id === 1 ? '"bab"' : '"bb"'}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}