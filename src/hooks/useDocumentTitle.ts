import { useEffect } from 'react';

const useDocumentTitle = (title: string): void => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `HomeServe | ${title}`;

    return () => {
      document.title = prevTitle;
    };
  }, [title]);
};

export default useDocumentTitle;