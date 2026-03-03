import { Link } from "react-router-dom"
import type {Problem} from "../../types"
import Badge from "./Badge"

export default function ProblemCard({ problem }: { problem: Problem }) {
  return (
    <div className="card bg-base-100 shadow-md hover:shadow-xl transition">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h2 className="card-title">{problem.title}</h2>
          <Badge difficulty={problem.difficulty} />
        </div>

        <p className="text-sm text-base-content/70 line-clamp-2">
          {problem.aiRecommend}
        </p>

        <div className="card-actions justify-end mt-4">
          <Link to={`/problems/${problem.id}`} className="btn btn-primary btn-sm">
            Solve
          </Link>
        </div>
      </div>
    </div>
  )
}