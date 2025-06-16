import { Component, createSignal, onMount, onCleanup } from "solid-js";
import * as d3 from "d3";
import type { Objective } from "../types/okr";

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  level: string;
  progress: number;
  children?: D3Node[];
  _children?: D3Node[];
}

const OKRTreeD3: Component = () => {
  let svgRef: SVGSVGElement | undefined;
  const [data, setData] = createSignal<Objective[]>([]);

  const convertToD3Data = (objective: Objective): D3Node => ({
    id: objective.id,
    name: objective.title,
    level: objective.level,
    progress: objective.progress,
    children: objective.children?.map(convertToD3Data)
  });

  const renderD3Tree = (data: D3Node[]) => {
    if (!svgRef) return;

    const width = 1200;
    const height = 800;
    const margin = { top: 20, right: 90, bottom: 30, left: 90 };

    // Clear previous content
    d3.select(svgRef).selectAll("*").remove();

    const svg = d3.select(svgRef)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const tree = d3.tree<D3Node>()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

    const root = d3.hierarchy(data[0]);
    const treeData = tree(root);

    // Add links
    svg.selectAll(".link")
      .data(treeData.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x))
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2);

    // Add nodes
    const node = svg.selectAll(".node")
      .data(treeData.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y},${d.x})`);

    // Add circles
    node.append("circle")
      .attr("r", 10)
      .attr("fill", d => {
        const progress = d.data.progress;
        if (progress >= 80) return "#22c55e"; // green
        if (progress >= 50) return "#eab308"; // yellow
        return "#ef4444"; // red
      });

    // Add progress bars
    node.append("rect")
      .attr("x", -20)
      .attr("y", 15)
      .attr("width", 40)
      .attr("height", 4)
      .attr("fill", "#e5e7eb")
      .attr("rx", 2);

    node.append("rect")
      .attr("x", -20)
      .attr("y", 15)
      .attr("width", d => (d.data.progress / 100) * 40)
      .attr("height", 4)
      .attr("fill", "#3b82f6")
      .attr("rx", 2);

    // Add labels
    node.append("text")
      .attr("dy", ".35em")
      .attr("x", d => d.children ? -13 : 13)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.name)
      .attr("fill", "#374151")
      .style("font-size", "12px");

    // Add level labels
    node.append("text")
      .attr("dy", "1.5em")
      .attr("x", d => d.children ? -13 : 13)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.level)
      .attr("fill", "#6b7280")
      .style("font-size", "10px");
  };

  onMount(async () => {
    // TODO: Implement API call to fetch OKR data
    const mockData: Objective[] = [
      {
        id: "1",
        title: "Unternehmensziel 2024",
        level: "company",
        progress: 75,
        keyResults: [],
        children: [
          {
            id: "2",
            title: "Circle Ziel: Entwicklung",
            level: "circle",
            progress: 60,
            keyResults: [],
            children: []
          }
        ]
      }
    ];
    setData(mockData);
    renderD3Tree(mockData.map(convertToD3Data));
  });

  onCleanup(() => {
    if (svgRef) {
      d3.select(svgRef).selectAll("*").remove();
    }
  });

  return (
    <div class="w-full overflow-auto">
      <svg ref={svgRef} class="w-full h-[800px]"></svg>
    </div>
  );
};

export default OKRTreeD3; 