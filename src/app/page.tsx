import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function RootPage({ searchParams }: PageProps) {
  const query = new URLSearchParams();

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (typeof value === 'string') {
        query.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, v));
      }
    });
  }

  const queryString = query.toString();
  const targetUrl = queryString ? `/expo?${queryString}` : '/expo';

  redirect(targetUrl);
}
