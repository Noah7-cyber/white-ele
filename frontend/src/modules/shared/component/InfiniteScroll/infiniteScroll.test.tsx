import React from 'react';

import { render } from '@testing-library/react';

import { InfiniteScroll } from '.';

describe('InfiniteScroll', () => {
  test('renders without crashing', () => {
    const { baseElement } = render(
      <InfiniteScroll
        hideLoading={false}
        hasMore={true}
      >
        <div>Content</div>
      </InfiniteScroll>,
    );

    expect(baseElement).toBeDefined();
    expect(baseElement).toMatchSnapshot();
  });

  test('renders children correctly', () => {
    const { getByText } = render(
      <InfiniteScroll
        hideLoading={false}
        hasMore={true}
      >
        <div>Test Content</div>
      </InfiniteScroll>,
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  test('does not show loading icon when hideLoading is true', () => {
    const { queryByRole } = render(
      <InfiniteScroll
        hideLoading={true}
        hasMore={true}
      >
        <div>Test Content</div>
      </InfiniteScroll>,
    );

    expect(queryByRole('loading')).not.toBeInTheDocument();
  });

  test('shows loading icon when hideLoading is false', () => {
    const { getByRole } = render(
      <InfiniteScroll
        hideLoading={false}
        hasMore={true}
      >
        <div>Test Content</div>
      </InfiniteScroll>,
    );

    expect(getByRole('loading')).toBeInTheDocument();
  });

  test('does not render loading icon when hasMore is false', () => {
    const { queryByRole } = render(
      <InfiniteScroll
        hideLoading={false}
        hasMore={false}
      >
        <div>Test Content</div>
      </InfiniteScroll>,
    );

    expect(queryByRole('loading')).not.toBeInTheDocument();
  });
});
