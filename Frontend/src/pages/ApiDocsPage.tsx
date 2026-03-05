import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

const OPENAPI_SPEC_URL = 'http://localhost:4000/api-docs/openapi.json'

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100">
      <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between bg-[#050816]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#5586e7]">api</span>
          <span className="text-sm font-semibold">InsightCode API Docs</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/system/diagrams"
            className="text-[11px] text-slate-300 hover:text-white underline underline-offset-4"
          >
            System diagrams
          </a>
          <span className="text-xs text-slate-400">Swagger UI · OpenAPI 3</span>
        </div>
      </div>
      <div className="swagger-ui-wrapper bg-white">
        <SwaggerUI url={OPENAPI_SPEC_URL} docExpansion="list" />
      </div>
    </div>
  )
}

