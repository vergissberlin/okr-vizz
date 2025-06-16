/* @refresh reload */
import './index.css';
import { render } from 'solid-js/web';
import { Router, Route } from "@solidjs/router";
import { MetaProvider } from "@solidjs/meta";
import App from './App';

const root = document.getElementById('root');

if (!root) {
  throw new Error("Root element not found");
}

render(
  () => (
    <MetaProvider>
      <Router base={import.meta.env.BASE_URL}>
        <Route path="/" component={App} />
      </Router>
    </MetaProvider>
  ),
  root
);
