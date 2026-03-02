import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface D3BarChartDatum {
  label: string
  value: number
}

interface D3BarChartProps {
  data: D3BarChartDatum[]
  max?: number
}

export default function D3BarChart({ data, max }: D3BarChartProps) {
  const ref = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (!ref.current || data.length === 0) return

    const width = 260
    const height = 120
    const margin = { top: 8, right: 8, bottom: 18, left: 40 }

    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()

    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const x = d3
      .scaleLinear()
      .domain([0, max ?? d3.max(data, (d) => d.value) ?? 0])
      .nice()
      .range([0, innerWidth])

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerHeight])
      .padding(0.3)

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    g.append('g')
      .attr('class', 'axis-y')
      .call(d3.axisLeft(y).tickSize(0))
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', 10)
      .attr('font-weight', 600)

    g.append('g')
      .attr('class', 'axis-x')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(4)
          .tickFormat((d) => `${d as number}%`),
      )
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', 9)

    g.selectAll('.bar-bg')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar-bg')
      .attr('x', 0)
      .attr('y', (d) => y(d.label) ?? 0)
      .attr('height', y.bandwidth())
      .attr('width', innerWidth)
      .attr('fill', '#e2e8f0')
      .attr('rx', 4)

    g.selectAll('.bar-fill')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar-fill')
      .attr('x', 0)
      .attr('y', (d) => (y(d.label) ?? 0) + 1)
      .attr('height', y.bandwidth() - 2)
      .attr('width', (d) => x(d.value))
      .attr('fill', '#5586e7')
      .attr('rx', 4)

    g.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', (d) => x(d.value) + 4)
      .attr('y', (d) => (y(d.label) ?? 0) + y.bandwidth() / 2 + 3)
      .attr('fill', '#64748b')
      .attr('font-size', 9)
      .attr('font-weight', 600)
      .text((d) => `${d.value}%`)
  }, [data, max])

  return (
    <svg
      ref={ref}
      viewBox="0 0 260 120"
      className="w-full h-[120px]"
      role="img"
      aria-label="Mastery chart"
    />
  )
}

