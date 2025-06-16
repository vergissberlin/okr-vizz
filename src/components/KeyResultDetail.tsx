import { Component, createSignal, Show } from "solid-js";
import type { KeyResult } from "../types/okr";
import { fetchIssueStatus, type GitHubIssue } from "../services/github";

interface KeyResultDetailProps {
  keyResult: KeyResult;
  onClose: () => void;
}

const KeyResultDetail: Component<KeyResultDetailProps> = (props) => {
  const [issueDetails, setIssueDetails] = createSignal<GitHubIssue | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const loadIssueDetails = async () => {
    if (!props.keyResult.githubIssueUrl) return;
    
    setLoading(true);
    setError(null);
    try {
      const issue = await fetchIssueStatus(props.keyResult.githubIssueUrl);
      setIssueDetails(issue);
    } catch (err) {
      setError("Fehler beim Laden der GitHub-Daten");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              {props.keyResult.title}
            </h2>
            <button
              onClick={props.onClose}
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <div class="space-y-6">
            {/* Fortschritt */}
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Fortschritt
              </h3>
              <div class="flex items-center space-x-4">
                <div class="flex-1">
                  <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                    <span>Aktuell: {props.keyResult.current} {props.keyResult.unit}</span>
                    <span>Ziel: {props.keyResult.target} {props.keyResult.unit}</span>
                  </div>
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      class={`h-full transition-all duration-500 ease-in-out ${
                        props.keyResult.status === 'green' ? 'bg-green-500' :
                        props.keyResult.status === 'yellow' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={`width: ${(props.keyResult.current / props.keyResult.target) * 100}%`}
                    />
                  </div>
                </div>
                <div class={`px-3 py-1 rounded-full text-sm font-medium ${
                  props.keyResult.status === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  props.keyResult.status === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {props.keyResult.status === 'green' ? 'Auf Kurs' :
                   props.keyResult.status === 'yellow' ? 'Gefährdet' :
                   'Kritisch'}
                </div>
              </div>
            </div>

            {/* Verantwortliche */}
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Verantwortliche
              </h3>
              <div class="flex flex-wrap gap-4">
                {props.keyResult.assignees.map(assignee => (
                  <div class="flex items-center space-x-2">
                    <img
                      src={assignee.avatarUrl}
                      alt={assignee.name}
                      class="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">
                        {assignee.name}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        {assignee.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GitHub Integration */}
            <Show when={props.keyResult.githubIssueUrl}>
              <div>
                <div class="flex justify-between items-center mb-2">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    GitHub Issue
                  </h3>
                  <button
                    onClick={loadIssueDetails}
                    disabled={loading()}
                    class="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading() ? "Lädt..." : "Details laden"}
                  </button>
                </div>
                <Show when={error()}>
                  <p class="text-red-500 text-sm mb-2">{error()}</p>
                </Show>
                <Show when={issueDetails()}>
                  <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div class="flex items-center space-x-2 mb-2">
                      <span class={`px-2 py-1 rounded-full text-xs font-medium ${
                        issueDetails()?.state === 'open'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {issueDetails()?.state === 'open' ? 'Offen' : 'Geschlossen'}
                      </span>
                      {issueDetails()?.labels.map(label => (
                        <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          {label.name}
                        </span>
                      ))}
                    </div>
                    <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <span>Zugewiesen an:</span>
                      {issueDetails()?.assignees.map(assignee => (
                        <div class="flex items-center space-x-1">
                          <img
                            src={assignee.avatar_url}
                            alt={assignee.login}
                            class="w-5 h-5 rounded-full"
                          />
                          <span>{assignee.login}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Show>
              </div>
            </Show>

            {/* Fälligkeitsdatum */}
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Fälligkeitsdatum
              </h3>
              <p class="text-gray-600 dark:text-gray-300">
                {new Date(props.keyResult.dueDate).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyResultDetail; 