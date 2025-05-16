import { useSearchParams } from 'react-router';

export default function SearchResult() {
  const [query] = useSearchParams();

  return <h1>{query.get('search')}</h1>;
}
