import { Component, createSignal, onMount, Show, createEffect } from "solid-js";
import * as d3 from "d3";
import type { Objective, KeyResult, OKRStatus } from "../types/okr";
import { fetchIssueStatus, determineStatusFromIssue, getIssueProgress } from "../services/github";
import KeyResultDetail from "./KeyResultDetail";
import okrData from "../data/okrs.json";

const OKRTree: Component = () => {
  const [data, setData] = createSignal<Objective[]>([]);
  const [expandedNodes, setExpandedNodes] = createSignal<Set<string>>(new Set());
  const [loading, setLoading] = createSignal<Record<string, boolean>>({});
  const [selectedKeyResult, setSelectedKeyResult] = createSignal<KeyResult | null>(null);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes());
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const updateKeyResultStatus = async (kr: KeyResult) => {
    if (!kr.githubIssueUrl) return;
    
    setLoading(prev => ({ ...prev, [kr.id]: true }));
    try {
      const issue = await fetchIssueStatus(kr.githubIssueUrl);
      const status = determineStatusFromIssue(issue) as OKRStatus;
      const progress = getIssueProgress(issue);
      
      setData(prev => prev.map(obj => ({
        ...obj,
        keyResults: obj.keyResults.map(k => 
          k.id === kr.id ? { ...k, status, current: progress } : k
        ),
        children: obj.children?.map(child => ({
          ...child,
          keyResults: child.keyResults.map(k => 
            k.id === kr.id ? { ...k, status, current: progress } : k
          )
        }))
      })));
    } catch (error) {
      console.error("Failed to fetch GitHub status:", error);
    } finally {
      setLoading(prev => ({ ...prev, [kr.id]: false }));
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "company": return "bg-blue-100 dark:bg-blue-900";
      case "division": return "bg-green-100 dark:bg-green-900";
      case "team": return "bg-purple-100 dark:bg-purple-900";
      default: return "bg-gray-100 dark:bg-gray-700";
    }
  };

  const getLevelBorder = (level: string) => {
    switch (level) {
      case "company": return "border-blue-500";
      case "division": return "border-green-500";
      case "team": return "border-purple-500";
      default: return "border-gray-500";
    }
  };

  const renderKeyResult = (kr: KeyResult, level: number) => (
    <div class={`ml-${level * 12} p-4 bg-white dark:bg-gray-800 rounded-lg shadow mb-2 transition-all duration-300 ease-in-out hover:shadow-lg cursor-pointer border-l-4 border-gray-300`}
         onClick={() => setSelectedKeyResult(kr)}>
      <div class="flex items-center justify-between">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">{kr.title}</h4>
        <div class="flex items-center space-x-2">
          {kr.assignees.map(assignee => (
            <img
              src={assignee.avatarUrl}
              alt={assignee.name}
              class="w-8 h-8 rounded-full"
              title={assignee.name}
            />
          ))}
        </div>
      </div>
      <div class="mt-2">
        <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>{kr.current} / {kr.target} {kr.unit}</span>
          <span>Due: {new Date(kr.dueDate).toLocaleDateString()}</span>
        </div>
        <div class="mt-1 h-2 rounded-full overflow-hidden">
          <div
            class={`h-full transition-all duration-500 ease-in-out ${
              kr.status === 'done' ? 'bg-green-500' :
              kr.status === 'in-progress' ? 'bg-yellow-500' :
              kr.status === 'blocked' ? 'bg-red-500' :
              'bg-gray-500'
            }`}
            style={`width: ${(kr.current / kr.target) * 100}%`}
          />
        </div>
        {kr.githubIssueUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateKeyResultStatus(kr);
            }}
            disabled={loading()[kr.id]}
            class="mt-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
          >
            {loading()[kr.id] ? "Aktualisiere..." : "Status aktualisieren"}
          </button>
        )}
      </div>
    </div>
  );

  const renderObjective = (objective: Objective, level: number = 0) => (
    <div class="mb-4">
      <div class={`flex items-center space-x-4 p-4 ${getLevelColor(objective.level)} rounded-lg transition-all duration-300 ease-in-out border-l-4 ${getLevelBorder(objective.level)} ml-${level * 12}`}>
        <button
          onClick={() => toggleNode(objective.id)}
          class="text-gray-600 dark:text-gray-300 transition-transform duration-300"
          style={{
            transform: expandedNodes().has(objective.id) ? 'rotate(90deg)' : 'rotate(0deg)'
          }}
        >
          ▶
        </button>
        <div class="flex-1">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-semibold px-2 py-1 rounded bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {objective.level.toUpperCase()}
            </span>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">{objective.title}</h3>
          </div>
          <div class="mt-2">
            <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Progress</span>
              <span>{objective.progress}%</span>
            </div>
            <div class="mt-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                class="h-2 bg-blue-500 transition-all duration-500 ease-in-out"
                style={`width: ${objective.progress}%`}
              />
            </div>
          </div>
        </div>
      </div>
      <Show when={expandedNodes().has(objective.id)}>
        <div class="mt-2 transition-all duration-300 ease-in-out">
          {objective.keyResults?.map(kr => renderKeyResult(kr, level + 1))}
          {objective.children?.map(child => renderObjective(child, level + 1))}
        </div>
      </Show>
    </div>
  );

  onMount(() => {
    // Hilfsfunktion zur rekursiven Typkonvertierung
    const convertToTypedObjective = (obj: any): Objective => ({
      ...obj,
      level: obj.level as "company" | "division" | "team",
      keyResults: obj.keyResults?.map((kr: any) => ({
        ...kr,
        status: kr.status as OKRStatus
      })) || [],
      children: obj.children?.map(convertToTypedObjective) || []
    });

    const typedData: Objective[] = okrData.objectives.map(convertToTypedObjective);
    setData(typedData);
  });

  return (
    <div class="space-y-4">
      {data().map(obj => renderObjective(obj))}
      <Show when={selectedKeyResult()}>
        <KeyResultDetail
          keyResult={selectedKeyResult()!}
          onClose={() => setSelectedKeyResult(null)}
        />
      </Show>
    </div>
  );
};

export default OKRTree; 