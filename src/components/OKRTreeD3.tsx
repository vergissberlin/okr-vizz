import { Component, createSignal, onMount, Show, For, onCleanup } from "solid-js";
import * as d3 from "d3";
import type { Objective as BaseObjective, KeyResult, OKRStatus } from "../types/okr";
import okrData from "../data/okrs.json";

type D3Level = "root" | "company" | "division" | "team";
interface Objective extends Omit<BaseObjective, "level" | "children"> {
  level: D3Level;
  children?: Objective[];
  status?: OKRStatus;
}

const statusColor = (status: OKRStatus | undefined) => {
  switch (status) {
    case "done": return "#22c55e"; // grün
    case "in-progress": return "#eab308"; // gelb
    case "blocked": return "#ef4444"; // rot
    case "todo": return "#6b7280"; // grau
    default: return "#a1a1aa"; // neutral
  }
};

// Farben für Fortschrittsbalken je Ebene
const progressBarColors = {
  company: "#60a5fa", // blau
  division: "#4ade80", // grün
  team: "#c084fc" // lila
};

const OKRTreeD3: Component = () => {
  const [selectedNode, setSelectedNode] = createSignal<any>(null);
  const [topObjectives, setTopObjectives] = createSignal<any[]>([]);
  let svgElement: SVGSVGElement | null = null;
  let zoomBehavior: d3.ZoomBehavior<Element, unknown> | null = null;

  // Für Reset
  let gElement: SVGGElement | null = null;
  const initialTransform = d3.zoomIdentity;
  let nodePositions: Record<string, { x: number; y: number }> = {};

  const resetZoom = () => {
    if (svgElement && zoomBehavior) {
      d3.select(svgElement).transition().duration(400).call(zoomBehavior.transform as any, initialTransform);
    }
  };

  // Navigation: zu einem bestimmten Objective springen
  const focusObjective = (id: string) => {
    if (!svgElement || !zoomBehavior || !nodePositions[id]) return;
    const { x, y } = nodePositions[id];
    const svgWidth = svgElement.width.baseVal.value;
    const svgHeight = svgElement.height.baseVal.value;
    const scale = 1.5;
    const tx = svgWidth / 2 - x * scale;
    // Maximale y-Translation: Box ganz oben, aber nicht außerhalb des SVG
    const minY = 0;
    const ty = Math.min(minY, 10 - y * scale); // maximal nach oben, aber nicht unter 0
    d3.select(svgElement).transition().duration(500).call(zoomBehavior.transform as any, d3.zoomIdentity.translate(tx, ty).scale(scale));
  };

  onMount(() => {
    // D3-Renderfunktion
    function renderOKRTree() {
      // Dark Mode erkennen
      const isDark = document.documentElement.classList.contains('dark');
      const width = 1200;
      const height = 800;
      const margin = { top: 20, right: 90, bottom: 30, left: 90 };
      const boxWidth = 220;
      const boxHeight = 200;
      const minBoxSpacing = 65;
      // Farben je nach Modus
      const boxBgColors = isDark
        ? { company: "#0f172a", division: "#0f172a", team: "#0f172a" }
        : { company: "#f3f4f6", division: "#f3f4f6", team: "#f3f4f6" };
      const boxBorderColors = isDark
        ? { company: "#334155", division: "#14532d", team: "#3b0764" }
        : { company: "#60a5fa", division: "#4ade80", team: "#c084fc" };
      const areaColors = isDark
        ? { company: "#1e293b", division: "#0f172a", team: "#2e1065" }
        : { company: "#e5e7eb", division: "#e5e7eb", team: "#e5e7eb" };
      const textColor = isDark ? "#f1f5f9" : "#111827";
      const subTextColor = isDark ? "#cbd5e1" : "#374151";
      const linkColor = isDark ? "#64748b" : "#ccc";
      const progressBg = isDark ? "#334155" : "#e5e7eb";
      const krBg = isDark ? "#1e293b" : "#f9fafb";
      const krBorder = isDark ? "#334155" : "#e5e7eb";
      const scrollbarBg = isDark ? "#334155" : "#e5e7eb";
      const scrollbarThumb = isDark ? "#64748b" : "#9ca3af";
      // Vorherige SVG entfernen
      d3.select("#okr-tree svg").remove();
      // Hilfsfunktion zur rekursiven Typkonvertierung
      const convertToTypedObjective = (obj: any): Objective => ({
        ...obj,
        level: obj.level as D3Level,
        keyResults: obj.keyResults?.map((kr: any) => ({
          ...kr,
          status: kr.status as OKRStatus
        })) || [],
        children: obj.children?.map(convertToTypedObjective) || []
      });
      // Künstlicher Root-Knoten, damit die Objectives die erste Ebene sind
      const rootData: Objective = {
        id: "root",
        title: "OKRs",
        level: "root",
        progress: 0,
        keyResults: [],
        children: okrData.objectives.map(convertToTypedObjective)
      };
      const data = d3.hierarchy<Objective>(rootData);
      // Tannenbaum-Layout
      const treeLayout = d3.tree<Objective>()
        .size([
          (data.height + 1) * minBoxSpacing,
          height - margin.top - margin.bottom
        ])
        .separation((a, b) => a.parent === b.parent ? 2.5 : 3);
      const root = treeLayout(data);
      // Nach Layout: x-Positionen so skalieren, dass Boxen nicht überlappen
      const nodes = root.descendants().filter(function(d: any) { return d.data.level !== "root"; });
      const xPositions = nodes.map(function(d: any) { return d.x; });
      const minX = Math.min(...xPositions);
      const maxX = Math.max(...xPositions);
      const neededWidth = (nodes.length - 1) * minBoxSpacing + boxWidth;
      const scaleX = d3.scaleLinear()
        .domain([minX, maxX])
        .range([0, neededWidth]);
      nodes.forEach(function(d: any) { d.x = scaleX(d.x); });
      const offsetX = (width - margin.left - margin.right - (maxX === minX ? 0 : neededWidth)) / 2;
      nodes.forEach(function(d: any) { d.x += offsetX > 0 ? offsetX : 0; });
      // SVG erstellen
      svgElement = d3.select("#okr-tree")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${neededWidth + margin.left + margin.right} ${height}`)
        .node();
      // Zoom-Behavior
      zoomBehavior = d3.zoom<Element, unknown>()
        .scaleExtent([0.3, 2.5])
        .on("zoom", function (event) {
          if (gElement) {
            d3.select(gElement).attr("transform", event.transform);
          }
        });
      d3.select(svgElement).call(zoomBehavior as any);
      // Hauptgruppe für Zoom
      gElement = d3.select(svgElement)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .node();
      const svg = d3.select(gElement);
      // --- Initialen Zoom so setzen, dass alle Boxen sichtbar sind ---
      const minBoxX = Math.min(...nodes.map((d: any) => d.x - boxWidth / 2));
      const maxBoxX = Math.max(...nodes.map((d: any) => d.x + boxWidth / 2));
      const minBoxY = Math.min(...nodes.map((d: any) => d.y - boxHeight / 2));
      const maxBoxY = Math.max(...nodes.map((d: any) => d.y + boxHeight / 2));
      const svgW = neededWidth + margin.left + margin.right;
      const svgH = height;
      const padding = 40;
      const scale = Math.min(
        (svgW - 2 * padding) / (maxBoxX - minBoxX),
        (svgH - 2 * padding) / (maxBoxY - minBoxY),
        1
      );
      const tx = (svgW / 2) - scale * (minBoxX + maxBoxX) / 2;
      const ty = (svgH / 2) - scale * (minBoxY + maxBoxY) / 2;
      d3.select(svgElement).call(zoomBehavior!.transform as any, d3.zoomIdentity.translate(tx, ty).scale(scale));
      // Verbindungslinien (überspringe künstlichen Root)
      svg.selectAll(".link")
        .data(root.links().filter(function(l: any) { return l.source.data.level !== "root"; }))
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", linkColor)
        .attr("stroke-width", 2)
        .attr("d", d3.linkVertical<d3.HierarchyPointLink<Objective>, d3.HierarchyPointNode<Objective>>()
          .x((d: any) => d.x)
          .y((d: any) => d.y));
      // Knoten (überspringe künstlichen Root)
      const node = svg.selectAll('.node')
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(d: any) { return `translate(${d.x - boxWidth / 2},${d.y - boxHeight / 2})`; })
        .style("cursor", "pointer")
        .on("click", function(event: any, d: any) { setSelectedNode(d); });
      node.append("rect")
        .attr("width", boxWidth)
        .attr("height", boxHeight)
        .attr("rx", 16)
        .attr("fill", function(d: any) {
          const level = d.data.level as "company" | "division" | "team";
          return boxBgColors[level];
        })
        .attr("stroke", function(d: any) {
          const level = d.data.level as "company" | "division" | "team";
          return boxBorderColors[level];
        })
        .attr("stroke-width", 2);
      // Titel mit SVG-Ellipsis (maximal 180px breit, bei Überlänge mit '…')
      node.append("text")
        .attr("x", 16)
        .attr("y", 32)
        .attr("font-size", 14)
        .attr("font-weight", "bold")
        .attr("fill", textColor)
        .each(function(this: SVGTextElement, d: any) {
          const text = d3.select(this);
          const fullTitle = d.data.title || "Unbekannt";
          let displayText = fullTitle;
          text.text(displayText);
          let maxWidth = 180;
          // Kürzen mit Ellipsis, falls zu lang
          while ((this as SVGTextElement).getComputedTextLength() > maxWidth && displayText.length > 0) {
            displayText = displayText.slice(0, -1);
            text.text(displayText + "…");
          }
          text.append("title").text(fullTitle);
        });
      // Fortschrittstext
      node.append("text")
        .attr("x", 16)
        .attr("y", 54)
        .attr("font-size", 13)
        .attr("fill", subTextColor)
        .text(function(d: any) { return `Fortschritt: ${d.data.progress || 0}%`; });
      // Fortschrittsbalken (Hintergrund)
      node.append("rect")
        .attr("x", 16)
        .attr("y", 60)
        .attr("width", boxWidth - 32)
        .attr("height", 8)
        .attr("rx", 4)
        .attr("fill", progressBg);
      // Fortschrittsbalken (Farbe)
      node.append("rect")
        .attr("x", 16)
        .attr("y", 60)
        .attr("height", 8)
        .attr("rx", 4)
        .attr("width", function(d: any) {
          const progress = d.data.progress || 0;
          return ((boxWidth - 32) * progress) / 100;
        })
        .attr("fill", function(d: any) {
          const level = d.data.level as "company" | "division" | "team";
          return progressBarColors[level];
        });
      // Key Results
      node.each(function(this: SVGGElement, d: d3.HierarchyPointNode<Objective>) {
        const keyResults = d.data.keyResults || [];
        if (keyResults.length === 0) return;
        const krGroup = d3.select(this)
          .append("g")
          .attr("class", "key-results")
          .attr("transform", `translate(16, 80)`);
        // Definiere Clip-Path für scrollbaren Bereich
        const clipId = `clip-${d.data.id}`;
        krGroup.append("defs")
          .append("clipPath")
          .attr("id", clipId)
          .append("rect")
          .attr("width", boxWidth - 32)
          .attr("height", 100);
        // Key Results Container
        krGroup.append("rect")
          .attr("width", boxWidth - 32)
          .attr("height", 100)
          .attr("rx", 4)
          .attr("fill", krBg)
          .attr("stroke", krBorder)
          .attr("stroke-width", 1);
        // Key Results Liste
        const krList = krGroup.append("g")
          .attr("transform", "translate(8, 8)")
          .attr("clip-path", `url(#${clipId})`);
        // Scrollbar
        const scrollbarGroup = krGroup.append("g")
          .attr("class", "scrollbar")
          .attr("transform", `translate(${boxWidth - 40}, 8)`);
        scrollbarGroup.append("rect")
          .attr("width", 4)
          .attr("height", 100)
          .attr("rx", 2)
          .attr("fill", scrollbarBg);
        const scrollbarHeight = Math.min(100, (100 * 100) / (keyResults.length * 20));
        const scrollbarY = 0;
        scrollbarGroup.append("rect")
          .attr("class", "scrollbar-thumb")
          .attr("width", 4)
          .attr("height", scrollbarHeight)
          .attr("y", scrollbarY)
          .attr("rx", 2)
          .attr("fill", scrollbarThumb)
          .style("cursor", "pointer")
          .call((d3.drag() as any)
            .on("drag", function(this: any, event: any) {
              const newY = Math.max(0, Math.min(100 - scrollbarHeight, event.y));
              d3.select(this).attr("y", newY);
              const scrollRatio = newY / (100 - scrollbarHeight);
              const maxScroll = (keyResults.length * 20) - 100;
              krList.attr("transform", `translate(8, ${8 - scrollRatio * maxScroll})`);
            }));
        keyResults.forEach((kr: any, i: number) => {
          const krItem = krList.append("g")
            .attr("transform", `translate(0, ${i * 28})`);
          // KR Titel
          krItem.append("text")
            .attr("font-size", 11)
            .attr("fill", subTextColor)
            .attr("y", 10)
            .each(function() {
              const text = d3.select(this);
              const fullTitle = kr.title;
              let displayText = fullTitle;
              text.text(displayText);
              let maxWidth = boxWidth - 48;
              while ((this as SVGTextElement).getComputedTextLength() > maxWidth && displayText.length > 0) {
                displayText = displayText.slice(0, -1);
                text.text(displayText + "…");
              }
              text.append("title").text(fullTitle);
            });
          // KR Fortschritt
          const progress = (kr.current / kr.target) * 100;
          krItem.append("rect")
            .attr("x", 0)
            .attr("y", 16)
            .attr("width", boxWidth - 48)
            .attr("height", 4)
            .attr("rx", 2)
            .attr("fill", progressBg);
          krItem.append("rect")
            .attr("x", 0)
            .attr("y", 16)
            .attr("width", ((boxWidth - 48) * progress) / 100)
            .attr("height", 4)
            .attr("rx", 2)
            .attr("fill", function() {
              const level = d.data.level as "company" | "division" | "team";
              return progressBarColors[level];
            });
          // KR Tooltip
          krItem.append("title")
            .text(`${kr.title}\n${kr.current}/${kr.target} ${kr.unit}`);
        });
      });
      // Tooltips
      node.append("title")
        .text(function(d: any) {
          if (!d.data.level) return "Unbekannt";
          return `${d.data.level.toUpperCase()}: ${d.data.title}\nProgress: ${d.data.progress || 0}%`;
        });
      // --- Navigation: Top-Level Objectives ---
      const tops = nodes.filter((d: any) => d.depth === 1);
      setTopObjectives(tops.map((d: any) => ({ id: d.data.id, title: d.data.title, x: d.x, y: d.y })));
      // Speichere alle Knotenpositionen für Navigation
      nodePositions = {};
      nodes.forEach((d: any) => { nodePositions[d.data.id] = { x: d.x, y: d.y }; });
      // --- Hintergrundflächen für Hierarchieebenen ---
      const levelColors = {
        company: "#3b82f6", // blau
        division: "#22c55e", // grün
        team: "#a855f7" // lila
      };
      const levels: Record<string, any[]> = { company: [], division: [], team: [] };
      nodes.forEach((d: any) => {
        if (d.data.level in levels) levels[d.data.level].push(d);
      });
      // Flächen zeichnen
      Object.entries(levels).forEach(([level, arr]) => {
        const typedLevel = level as "company" | "division" | "team";
        if (arr.length === 0) return;
        const minX = Math.min(...arr.map((d: any) => d.x - boxWidth / 2)) - 24;
        const maxX = Math.max(...arr.map((d: any) => d.x + boxWidth / 2)) + 24;
        const minY = Math.min(...arr.map((d: any) => d.y - boxHeight / 2)) - 16;
        const maxY = Math.max(...arr.map((d: any) => d.y + boxHeight / 2)) + 16;
        svg.insert("rect", ":first-child")
          .attr("x", minX)
          .attr("y", minY)
          .attr("width", maxX - minX)
          .attr("height", maxY - minY)
          .attr("rx", 32)
          .attr("fill", areaColors[typedLevel] + "CC") // 80% opacity
          .attr("stroke", boxBorderColors[typedLevel])
          .attr("stroke-width", 1)
          .lower();
      });
    }
    // Initial rendern
    renderOKRTree();
    // Dark Mode Observer
    const observer = new MutationObserver(() => {
      renderOKRTree();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    // Clean up
    onCleanup(() => observer.disconnect());
  });

  return (
    <div class="relative">
      <div class="absolute top-2 left-2 z-10 flex gap-2">
        <button onClick={resetZoom} class="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded shadow text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
          Ansicht zurücksetzen
        </button>
        <For each={topObjectives()}>{(obj) => (
          <button
            class="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded shadow text-blue-800 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800 transition font-semibold"
            onClick={() => focusObjective(obj.id)}
            title={obj.title}
          >
            {obj.title.length > 22 ? obj.title.slice(0, 21) + "…" : obj.title}
          </button>
        )}</For>
      </div>
      <div id="okr-tree" class="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg" />
      <Show when={selectedNode()}>
        <div class="absolute top-4 right-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {selectedNode().data.title || "Unbekannt"}
          </h3>
          <div class="text-sm text-gray-600 dark:text-gray-300">
            <p>Level: {selectedNode().data.level?.toUpperCase() || "Unbekannt"}</p>
            <p>Progress: {selectedNode().data.progress || 0}%</p>
            <Show when={selectedNode().data.keyResults?.length > 0}>
              <div class="mt-2">
                <h4 class="font-semibold">Key Results:</h4>
                <ul class="list-disc list-inside">
                  {selectedNode().data.keyResults.map((kr: KeyResult) => (
                    <li>{kr.title} ({kr.current}/{kr.target} {kr.unit})</li>
                  ))}
                </ul>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default OKRTreeD3; 