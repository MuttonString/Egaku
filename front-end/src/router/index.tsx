import { createBrowserRouter, Navigate } from 'react-router';
import App from '../App';
import Home from '../pages/Home';
import Recommendation from '../pages/Recommendation';
import Subscription from '../pages/Subscription';
import Article from '../pages/Article';
import VideoPage from '../pages/VideoPage';
import PersonalSpace from '../pages/PersonalSpace';
import NotFound from '../pages/NotFound';
import SearchResult from '../pages/SearchResult';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'recommendation',
        element: <Recommendation />,
      },
      {
        path: 'subscription',
        element: <Subscription />,
      },
      {
        path: 'article',
        element: <Article />,
      },
      {
        path: 'video',
        element: <VideoPage />,
      },
      {
        path: 'personal',
        element: <Navigate to="collection" />,
      },
      {
        path: 'personal/:tab',
        element: <PersonalSpace />,
      },
      {
        path: 'search',
        element: <SearchResult />,
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default router;
