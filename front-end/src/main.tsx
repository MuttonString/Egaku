import ReactDOM from 'react-dom/client';
import './index.less';
import { RouterProvider } from 'react-router';
import router from './router';
import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/LocalizedFormat';

dayjs.extend(LocalizedFormat);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
);
