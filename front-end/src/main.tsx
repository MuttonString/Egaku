import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.less';
import { BrowserRouter, Route, Routes } from 'react-router';
import NotFound from './pages/NotFound/index.tsx';
import Home from './pages/Home/index.tsx';
import Recommendation from './pages/Recommendation/index.tsx';
import Subscription from './pages/Subscription/index.tsx';
import Article from './pages/Article/index.tsx';
import VideoPage from './pages/VideoPage/index.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="recommendation" element={<Recommendation />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="article" element={<Article />} />
          <Route path="video" element={<VideoPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
