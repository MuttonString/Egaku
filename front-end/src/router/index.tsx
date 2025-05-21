import { createBrowserRouter, Navigate } from 'react-router';
import App from '../App';
import Home from '../pages/Home';
import Subscription from '../pages/Subscription';
import Article from '../pages/Article';
import VideoPage from '../pages/VideoPage';
import PersonalSpace from '../pages/PersonalSpace';
import NotFound from '../pages/NotFound';
import SearchResult from '../pages/SearchResult';
import SingleArticle from '../pages/SingleArticle';
import Submission from '../pages/Submission';
import SingleVideo from '../pages/SingleVideo';

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
        path: 'subscription',
        element: <Subscription />,
      },
      {
        path: 'article',
        element: <Article />,
      },
      {
        path: 'article/:id',
        element: <SingleArticle />,
      },
      {
        path: 'video',
        element: <VideoPage />,
      },
      {
        path: 'video/:id',
        element: <SingleVideo />,
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
      {
        path: 'submission',
        element: <Submission />,
      },
      {
        path: 'submission/:uid',
        element: <Submission />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
